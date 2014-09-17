Meteor.startup(function(){
	Meteor.methods({send_mail: function(args){this.unblock(); console.log('SENDING MAIL',args); Email.send(args)}})
})