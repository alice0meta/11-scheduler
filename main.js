#!/usr/bin/env node

require('./ζtt')
var Mailgun = require('mailgun-js')
var csv_parse = require('csv-parse')

//! 1) Automate the writing and sending of emails, using a basic template and pasting in various fields from the google spreadsheet as variables (i.e. names, email addresses, Skype names, interests). This would start with a list of partners as input, and I'm pretty sure it isn't that hard to do.
//! 2) Automate the pairing-up process. This is both less tedious for a human, and seems harder to automate, so I'm happy for it to come later. Basically, people need to be paired with other people who are available at the same time (if they're in the doodle), preferably who they haven't been paired up with for a while. Fancier versions could take common interests into account.
//! do time zone conversions automatically
//! do check for security

var api_key = fs('key.txt').$+''
var settings = JSON.parse(fs('settings.json').$)

var mailgun = new Mailgun({apiKey:api_key, domain:settings.domain})

var User = function(name,email,skype,knows,wants){
	this.name = name; this.email = email; this.skype = skype
	this.knows = knows.split('\n').map(function(v){return v.trim()}).join('; ')
	this.wants = wants.split('\n').map(function(v){return v.trim()}).join('; ')
	}
	.def('firstname',function(){return this.name.replace(/ +.*/,'')})

var template_eval = function(a,b,time){
	var full = 'dddd MMMM Do, HH:mm [UTC]'
	return function(v){return eval(v)}}

var template_expand = function(v,eval_fn){return v.replace(/\{([^\}]+)\}/g,function(_,v){var t; return is(t=eval_fn(v))?t:''})}

var email_parse = function(v){
	var t = v.match(/^from:(.+)\nto:(.+)\nsubject:(.+)\n([\s\S]+)$/)
	return {from:t[1].trim(), to:t[2].trim(), subject:t[3].trim(), text:t[4].trim()}}

var send_1on1_notification = function(a,b,time){
	var v = email_parse(template_expand(fs('email - 1on1 notification.txt').$+'',template_eval(a,b,time)))
	print(moment(),'SENDING',v)
	mailgun.messages().send(v,function(e,body){
		print('err:',e)
		print('body:',body)
	})
	}

var users
var get_users = function(cb){csv_parse(fs('users.csv').$+'',{trim:true},function(e,v){cb(e,v.slice(1).map(function(v){return new User(v[1],v[2],v[3],v[5],v[6])})._.indexBy('email'))})}

var main = function(){
	if (process.argv[2]==='send') send_1on1_notification(users[process.argv[3]], users[process.argv[4]], moment(process.argv[5]).utc())
	else throw '‽ bad args' }

get_users(function(e,v){users = v; main()})