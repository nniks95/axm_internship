if(typeof(axm) === "undefined"){
    axm = {
        __namespace:true
    };
}
if(typeof(axm.quickCreate)==="undefined"){
    axm.quickCreate = {
        __namespace : true
    };
}

axm.quickCreate.Event = (function(){
    var onLoad = function(executionContext){
        var formContext = executionContext.getFormContext();
        formContext.getControl("axm_guesttype").getAttribute().addOnChange(deleteGuestType);
        deleteGuestType(executionContext);
    };

    var deleteGuestType = function(executionContext){
        var formContext = executionContext.getFormContext();
        var guestType = formContext.getControl("axm_guesttype");
        if(guestType){
            var options = guestType.getOptions();
            for(var i = 0; i < options.length; i++){
                if(options[i].value === 0){
                    guestType.removeOption(options[i].value);
                    break;
                 }
            }
        }
    };
    
    return {
        OnLoad: onLoad
    };

})();
