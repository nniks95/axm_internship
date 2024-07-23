if(typeof(axm) === "undefined"){
    axm = {
        __namespace:true
    };
}
if(typeof(axm.UpdateReservationAndRibbon)==="undefined"){
    axm.UpdateReservationAndRibbon = {
        __namespace : true
    };
}

axm.UpdateReservationAndRibbon.Ribbon = (function() {
    var filterReservations = function(primaryControl){
        var context = Xrm.Utility.getGlobalContext();
        var formContext = primaryControl;
        var currentfetch = formContext.getFetchXml();
        var grid = formContext.getGrid().getRows();
        var viewSelector = formContext.getViewSelector();
        var currentview = viewSelector.getCurrentView();
        var userId = context.userSettings.userId.replace(/{|}/g, "").toLowerCase();
        if(grid){
            var fetchXml=`
<fetch output-format="xml-platform" mapping="logical" savedqueryid="87493e57-ef44-ef11-a316-000d3a2cc1b7" page="1" count="50" no-lock="false">
  <entity name="axm_reservation">
    <attribute name="axm_reservation" />
    <attribute name="axm_reservationid" />
    <attribute name="createdon" />
    <attribute name="axm_primaryguest" />
    <attribute name="axm_room" />
    <attribute name="axm_startdate" />
    <attribute name="axm_enddate" />
    <attribute name="axm_durationindays" />
    <attribute name="axm_paid" />
    <filter>
      <condition attribute="createdby" operator="eq" value="${userId}" />
    </filter>
    <order attribute="createdon" descending="false" />
    <order attribute="axm_primaryguest" descending="false"/>
    <order attribute="axm_room" descending="false"/>
  </entity>
</fetch>`;
            var myReservations= {
                entityType: 1039,
                id: "{87493e57-ef44-ef11-a316-000d3a2cc1b7}",
                name : "Filtered Reservations"
            }
            viewSelector.setCurrentView(myReservations);
       }
   };
    var deactivateReservation = function(primaryControl){
       var formContext = primaryControl;
       var subgrid = formContext.getControl("axm_relatedbill").getGrid();
       var reservationId = formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
       var numberOfRows = subgrid.getTotalRecordCount();
       if(numberOfRows > 0){
           //Check if there are records in sub grid
           handleExistingBills(reservationId, formContext);
           return;
       }else{
           Xrm.WebApi.retrieveRecord("axm_reservation", reservationId, "?$select=axm_paid,statuscode,statecode").then(
               function success(result){
                   if(result.axm_paid === false){
                       formContext.ui.setFormNotification("Reservation is not paid","WARNING","reservationNotPaid");
                   }else{
                       var updateStatus = {
                           statuscode: 2,
                           statecode: 1
                       };
                       Xrm.WebApi.updateRecord("axm_reservation", reservationId, updateStatus).then(
                           function success(){
                               formContext.ui.setFormNotification("Reservation is set to INACTIVE", "INFO", "billsPaid");
                               formContext.data.refresh(true);
                               formContext.ui.clearFormNotification("billsPaid");
                               formContext.ui.clearFormNotification("reservationNotPaid");
                           }
                       );
                   }
               }
           );
       }
   }; 
    return {
       deactivateReservation: deactivateReservation,
       filterReservations: filterReservations
    };
 })();

 axm.UpdateReservationAndRibbon.Event = (function() {
    var onLoad = function(executionContext) {
        var formContext = executionContext.getFormContext();
        formContext.getControl("axm_room").getAttribute().addOnChange(guestCapacityErrorMessage);
        guestCapacityErrorMessage(executionContext);
        var startDate = formContext.getAttribute("axm_startdate");
        var endDate = formContext.getAttribute("axm_enddate");
        if(startDate.getValue() === null && endDate.getValue() === null){
          formContext.getControl("axm_room").addPreSearch(filteredLookup);
        }
        startDate.addOnChange(filteredLookup);
        endDate.addOnChange(filteredLookup);
        formContext.getControl("axm_primaryguest").getAttribute().addOnChange(fillEmailAndPhone);
        fillEmailAndPhone(executionContext);
    };

    var guestCapacityErrorMessage = function(executionContext) {
        var formContext = executionContext.getFormContext();
        var roomValue = formContext.getAttribute("axm_room").getValue();
        if (roomValue) {
            var roomId = roomValue[0].id;
            var entityType = roomValue[0].entityType;
            Xrm.WebApi.retrieveRecord(entityType, roomId, "?$select=_axm_roomtype_value&$expand=axm_Roomtype($select=axm_maximumguests)").then(
                function success(result) {
                    var maximumGuestsValue = result.axm_Roomtype.axm_maximumguests;
                    var primaryGuestValue = formContext.getAttribute("axm_primaryguest").getValue();
                    if(primaryGuestValue != null){
                        var guestId = primaryGuestValue[0].id;
                        guestId = guestId.replace(/{|}/g, "").toLowerCase();
                        var fetchXml = `
<fetch>
  <entity name="axm_guest">
    <link-entity name="axm_guest" from="axm_guestid" to="axm_guest">
      <filter>
        <condition attribute="axm_guestid" operator="eq" value="${guestId}" />
      </filter>
    </link-entity>
  </entity>
</fetch>`;
                        Xrm.WebApi.retrieveMultipleRecords("axm_guest", "?fetchXml=" + fetchXml).then(
                            function (results){
                                var relatedGuests = 1 + results.entities.length;
                                if (relatedGuests > maximumGuestsValue) {
                                    formContext.ui.setFormNotification("Guest count exceeds maximum allowed for this room.", "ERROR", "guest_capacity_error");
                                } else {
                                    formContext.ui.clearFormNotification("guest_capacity_error");
                                }
                                        
                            }
                        );
                    } 
                },
                function(error) {
                console.error("Error retrieving room type record: " + error.message);
                },
            );
        }
    };
    var filteredLookup = function(executionContext){
        var formContext = executionContext.getFormContext();
        var roomLookup = formContext.getControl("axm_room");
        var fetchXml = getFetchXml(executionContext);
        if(fetchXml){
          var layoutXml = `<grid name="axm_rooms" object="10423" jump="axm_roomnumber" select="1" icon="1" preview="0"><row name="axm_room" id="axm_roomid"><cell name="axm_roomnumber" width="300"/></row></grid>`;
          var viewId = roomLookup.getDefaultView();
          var entityName = "axm_room";
          var viewDisplayName = "FilteredRooms";
          roomLookup.addCustomView(viewId,entityName,viewDisplayName,fetchXml,layoutXml,true);
        }
      };
  
  
      var getFetchXml = function(executionContext){
          var formContext = executionContext.getFormContext();
          var startDateField = formContext.getAttribute("axm_startdate").getValue();
          var endDateField = formContext.getAttribute("axm_enddate").getValue();
          if(startDateField && endDateField ){
              var startDate = new Date(startDateField);
              var endDate = new Date(endDateField);
              var formatedStartDate = formatDate(startDate);
              var formatedEndDate = formatDate(endDate);
              var fetchXml = `
  <fetch>
    <entity name="axm_room">
      <attribute name="axm_roomid" />
      <link-entity name="axm_reservation" from="axm_room" to="axm_roomid" link-type="outer">
        <attribute name="axm_reservationid" />
        <filter type="and">
          <condition attribute="axm_startdate" operator="on-or-before" value="${formatedEndDate}" />
          <condition attribute="axm_enddate" operator="on-or-after" value="${formatedStartDate}" />
        </filter>
      </link-entity>
      <filter type="and">
        <condition entityname="axm_reservation" attribute="axm_reservationid" operator="null" />
      </filter>
    </entity>
  </fetch>`;
              return fetchXml;
            }else{
              var fetchXml = `
  <fetch distinct="true">
    <entity name="axm_room">
      <attribute name="axm_roomid" />
      <filter />
      <link-entity name="axm_reservation" from="axm_room" to="axm_roomid" link-type="outer">
        <attribute name="axm_reservationid" />
      </link-entity>
      <filter type="and">
        <condition entityname="axm_reservation" attribute="axm_reservationid" operator="null" />
      </filter>
    </entity>
  </fetch>`;
              return fetchXml;
          }
      };
      
  
      function formatDate(date){
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
    
        return `${year}-${month}-${day}`;
      };

      var fillEmailAndPhone = function(executionContext){
        var formContext = executionContext.getFormContext();
        var primaryGuestField = formContext.getAttribute("axm_primaryguest");
        var primaryGuestValue = primaryGuestField.getValue();
        if(primaryGuestValue != null){
            settingUsersEmailAndPhone(primaryGuestValue, formContext);
            return;
        }
    };

    return {
        OnLoad: onLoad
    };

 })();

function settingUsersEmailAndPhone(primaryGuestValue, formContext) {
    var guestId = primaryGuestValue[0].id;
    var entityType = primaryGuestValue[0].entityType;
    var email = "axm_primaryemail";
    var phone = "axm_primarymobilenumber";
    Xrm.WebApi.retrieveRecord(entityType, guestId, "?$select=" + email + "," + phone).then(
        function success(result) {
            var emailValue = result[email];
            var phoneValue = result[phone];
            formContext.getAttribute("axm_email").setValue(emailValue);
            formContext.getAttribute("axm_mobile").setValue(phoneValue);
        },
        function (error) {
            console.log("Error retreiving record: ", error.message);
        }
    );
}

function handleExistingBills(reservationId, formContext) {
    Xrm.WebApi.retrieveMultipleRecords("axm_bill", "?$select=_axm_reservation_value,axm_paid" + "&$filter=_axm_reservation_value eq " + reservationId + " and axm_paid eq false").then(
        function success(result) {
            //if any of the records have axm_paid field set to NO, leave the for loop, and show message
            if (result.entities.length > 0) {
                formContext.ui.setFormNotification("Bills are not paid", "WARNING", "billsNotPaid");
            } else {
                //If there is no records i subgrid, check if the reservation is paid or not
                Xrm.WebApi.retrieveRecord("axm_reservation", reservationId, "?$select=axm_paid,statuscode,statecode").then(
                    function success(result) {
                        if (result.axm_paid === false) {
                            formContext.ui.setFormNotification("Reservation is not paid", "WARNING", "reservationNotPaid");
                            //if reservation is not paid, show the message
                        } else {
                            var updateStatus = {
                                statuscode: 2,
                                statecode: 1
                            };
                            //if reservation is paid, update record and set reservation to inactive
                            Xrm.WebApi.updateRecord("axm_reservation", reservationId, updateStatus).then(
                                function success() {
                                    formContext.ui.setFormNotification("Reservation is set to INACTIVE", "INFO", "billsPaid");
                                    formContext.data.refresh(true);
                                    formContext.ui.clearFormNotification("billsPaid");
                                    formContext.ui.clearFormNotification("reservationNotPaid");
                                    formContext.ui.clearFormNotification("billsNotPaid");
                                }
                            );
                        }
                    }
                );
            }
        }
    );
}
