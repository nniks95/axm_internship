if(typeof(axm) === "undefined"){
    axm = {
        __namespace:true
    };
}
if(typeof(axm.guest)==="undefined"){
    axm.guest = {
        __namespace : true
    };
}

axm.guest.Event = (function(){
    var onLoad = function(executionContext){
        var formContext = executionContext.getFormContext();
        formContext.getControl("axm_guesttype").getAttribute().addOnChange(guestTypeChange);
        formContext.getControl("axm_guests").addPreSearch(addCustomFilter);
        guestTypeChange(executionContext);
    };
    var onSave = function(executionContext){

    };

    var guestTypeChange = function(executionContext){
        var formContext = executionContext.getFormContext();
        var guestType = formContext.getAttribute("axm_guesttype").getValue();
        var subGrid = Xrm.Page.getControl("axm_relatedguests");
        if(subGrid){
            if(guestType === 0){
                subGrid.setVisible(true);
                formContext.getControl("axm_relatedguests").setVisible(true);
                formContext.getControl("axm_primaryemail").setVisible(true);
                formContext.getControl("axm_secondaryemail").setVisible(true);
                formContext.getControl("axm_primarymobilenumber").setVisible(true);
                formContext.getControl("axm_secondarymobilenumber").setVisible(true);
                formContext.getControl("axm_addressline1").setVisible(true);
                formContext.getControl("axm_addressline2").setVisible(true);
                formContext.getControl("axm_guests").setVisible(false);
                formContext.getControl("axm_primaryemail").setDisabled(false);
                formContext.getControl("axm_secondaryemail").setDisabled(false);
                formContext.getControl("axm_primarymobilenumber").setDisabled(false);
                formContext.getControl("axm_secondarymobilenumber").setDisabled(false);
                formContext.getControl("axm_addressline1").setDisabled(false);
                formContext.getControl("axm_addressline2").setDisabled(false);
            }else if(guestType === 1){
                subGrid.setVisible(false);
                formContext.getControl("axm_primaryemail").setDisabled(true);
                formContext.getControl("axm_secondaryemail").setDisabled(true);
                formContext.getControl("axm_primarymobilenumber").setDisabled(true);
                formContext.getControl("axm_secondarymobilenumber").setDisabled(true);
                formContext.getControl("axm_addressline1").setDisabled(true);
                formContext.getControl("axm_addressline2").setDisabled(true);
                formContext.getControl("axm_relatedguests").setVisible(false);
                formContext.getControl("axm_guests").setVisible(true);
                formContext.getControl("axm_primaryemail").setVisible(true);
                formContext.getControl("axm_secondaryemail").setVisible(true);
                formContext.getControl("axm_primarymobilenumber").setVisible(true);
                formContext.getControl("axm_secondarymobilenumber").setVisible(true);
                formContext.getControl("axm_addressline1").setVisible(true);
                formContext.getControl("axm_addressline2").setVisible(true);
            }else if(guestType === 2){
                subGrid.setVisible(false);
                formContext.getControl("axm_relatedguests").setVisible(false);
                formContext.getControl("axm_guests").setVisible(true);
            }
        }
        
    };

    function addCustomFilter(executionContext){
        var formContext = executionContext.getFormContext();
        var guestLookUp = formContext.getControl("axm_guests")
        var fetchXml = `
        <fetch>
          <entity name="axm_guest">
            <attribute name="axm_guestid" />
            <attribute name="axm_guesttype" />
            <filter type="and">
               <condition attribute="axm_guesttype" operator="eq" value="0" />
            </filter>
          </entity>
        </fetch>`;
        guestLookUp.addCustomFilter(fetchXml,"axm_guest");
    };

    return {
        OnLoad: onLoad,
        OnSave: onSave
    };
})();


