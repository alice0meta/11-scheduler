#!/usr/bin/env node

require('./ζtt')
var Mailgun = require('mailgun-js')
var csv_parse = require('csv-parse')

//! 1) Automate the writing and sending of emails, using a basic template and pasting in various fields from the google spreadsheet as variables (i.e. names, email addresses, Skype names, interests). This would start with a list of partners as input, and I'm pretty sure it isn't that hard to do.
//! 2) Automate the pairing-up process. This is both less tedious for a human, and seems harder to automate, so I'm happy for it to come later. Basically, people need to be paired with other people who are available at the same time (if they're in the doodle), preferably who they haven't been paired up with for a while. Fancier versions could take common interests into account.
//    "I do some of it on fuzzy-human-brain-pattern-matching but I can try to make it explicit. Basically I start with the person who's available at the smallest number of times, pair them randomly with someone available at the same time (usually the person closest to them vertically in the doodle), jump to the google doc 'Record of Partners' tab to make sure they haven't already been with that person in the last three weeks, if they have I pick a different person if one is available. Then I type those two names and the date and time into a txt file and mentally cross them off the list. I go to the person who has the next narrowest availability (this is very roughly judged, basically by glancing at it visually) and partner them, doing the same check. I do this until everyone is left."
//    "Sometimes I also do it "lazily" by just starting with the person at the top of the responses, partnering them ideally with the 2nd person, and proceeding downwards, but often I end up with two leftover people who have no overlapping availability and I have to go back and redo it."
//! do time zone conversions automatically
//! Yeah. In fact, there's a problem where people only submit first names and I have to guess who they are. 

var api_key = fs('key.txt').$+''
var settings = JSON.parse(fs('settings.json').$)

var mailgun = new Mailgun({apiKey:api_key, domain:settings.domain})

var user = function(v){
	v.knows = v.knows.split('\n').map(function(v){return v.trim()}).join('; ')
	v.wants = v.wants.split('\n').map(function(v){return v.trim()}).join('; ')
	v.firstname = v.name.replace(/ +.*/,'')
	return v}

var template_eval = function(a,b,time){
	var full = 'dddd MMMM Do, HH:mm [UTC]'
	return function λ(v){var t = eval(v); return t && t.indexOf('{') !== -1? template_expand(t,λ) : t}}

var template_expand = function(v,eval_fn){return v.replace(/\{(([^\{\}]|\{([^\}]+)\})+)\}/g,function(_,v){var t; return is(t=eval_fn(v))?t:''})}

var email_parse = function(v){
	var t = v.match(/^from:(.+)\nto:(.+)\nsubject:(.+)\n([\s\S]+)$/)
	return {from:t[1].trim(), to:t[2].trim(), subject:t[3].trim(), text:t[4].trim().replace(/\n+/g,'\n')}}

var send_1on1_notification = function(a,b,time){
	var v = email_parse(template_expand(fs('email - 1on1 notification.txt').$+'',template_eval(a,b,time)))
	print(moment(),'SENDING',v)
	mailgun.messages().send(v,function(e,body){
		print('err:',e)
		print('body:',body)
	})
	}

var csv_parse_keyed = function(v,cb){csv_parse(v,{trim:true},function(e,rows){cb(e,rows.slice(1).map(function(v){return _.object(rows[0],v)}))})}

var users
var get_users = function(cb){csv_parse_keyed(fs('users.csv').$+'',function(e,v){cb(e,v.map(user)._.indexBy('name'))})}

var doodle_poll_data = function(cb){exec('curl http://doodle.com/'+process.argv[3],function(e,v){cb(e,JSON.parse(v.match(/doodleJS.data.poll = (.+?);\s*doodleJS.data.poll.keywordsJson/)[1]))})}

switch (process.argv[2]) {
	case 'send': get_users(function(e,v){users = v; send_1on1_notification(users[process.argv[3]], users[process.argv[4]], moment(process.argv[5]).utc())}); break
	case 'doodle': doodle_poll_data(function(e,v){print(v.participants.map(function(v){return _.pick(v,'name','preferences')}),v.optionsText)}); break
	default: throw '‽ bad args' }