$(document).ready(function(){

//! 1) Automate the writing and sending of emails, using a basic template and pasting in various fields from the google spreadsheet as variables (i.e. names, email addresses, Skype names, interests). This would start with a list of partners as input, and I'm pretty sure it isn't that hard to do.
//! 2) Automate the pairing-up process. This is both less tedious for a human, and seems harder to automate, so I'm happy for it to come later. Basically, people need to be paired with other people who are available at the same time (if they're in the doodle), preferably who they haven't been paired up with for a while. Fancier versions could take common interests into account.
//    "I do some of it on fuzzy-human-brain-pattern-matching but I can try to make it explicit. Basically I start with the person who's available at the smallest number of times, pair them randomly with someone available at the same time (usually the person closest to them vertically in the doodle), jump to the google doc 'Record of Partners' tab to make sure they haven't already been with that person in the last three weeks, if they have I pick a different person if one is available. Then I type those two names and the date and time into a txt file and mentally cross them off the list. I go to the person who has the next narrowest availability (this is very roughly judged, basically by glancing at it visually) and partner them, doing the same check. I do this until everyone is left."
//    "Sometimes I also do it "lazily" by just starting with the person at the top of the responses, partnering them ideally with the 2nd person, and proceeding downwards, but often I end up with two leftover people who have no overlapping availability and I have to go back and redo it."
//! do time zone conversions automatically
//! Yeah. In fact, there's a problem where people only submit first names and I have to guess who they are. 
//! make template field more persistent
//! Would it be possible to have a prefered pronoun in there?
//! Also, can we do automatic time zone conversion? 

// we executed
// send "Tony Parisi" "Melanie Heisey" "Tuesday September 16 2014 21:00 UTC"
// send "Matt Barbacki" "Andrew Rettek" "Tuesday September 16 2014 21:00 UTC"
// send "Ben West" "Patrick Hunter" "Saturday September 20 2014 15:00 UTC"
// send "Chris Watkins" "Malcolm Ocean" "Friday September 19 2014 00:00 UTC"

//===------------------------===// copypasted //===------------------------===//

Function.prototype.def = function(m,get,set){Object.defineProperty(this.prototype,m,{configurable:true, enumerable:false, get:get, set:set}); return this}
Array.def('_',function(){return _(this)})

//===---------------------------===// util //===---------------------------===//

// var persist_field = function(id){$(id).val(localStorage.getItem(id)); $(id).change(function(){localStorage.setItem(id,$(id).val())})}
var read_file = function(fl,cb){var t = new FileReader(); $(t).on('loadend',function(){cb(null,t.result)}); t.readAsText(fl)}
var csv_parse_keyed = function(v,cb){csvParse(v,{trim:true},function(e,rows){cb(e,rows.slice(1).map(function(v){return _.object(rows[0],v)}))})}
var print = console.log.bind(console)
var is = function(v){return v!==undefined}

//===--------------------===// this-specific util //===--------------------===//

var user = function(v){
	v.knows = v.knows.split('\n').map(function(v){return v.trim()}).join('; ')
	v.wants = v.wants.split('\n').map(function(v){return v.trim()}).join('; ')
	v.firstname = v.name.replace(/ +.*/,'')
	return v}

var template_eval = function(args){
	args.full = args.full || 'MMMM Do, HH:mm [UTC]'
	return function λ(v){var t; with (args) {t = eval(v)}; return t && t.indexOf('{') !== -1? template_expand(t,λ) : t}}
var template_expand = function(v,eval_fn){return v.replace(/\{(([^\{\}]|\{([^\}]+)\})+)\}/g,function(_,v){var t; return is(t=eval_fn(v))?t:''})}
var mail_parse = function(v){
	var t = v.match(/^((?:\w+:.+\n)*)([\s\S]+)$/)
	var r = {text:t[2].trim().replace(/\n+/g,'\n')}
	t[1].trim().split('\n').map(function(v){return v.trim().match(/^(\w+): (.+)$/).slice(1)}).map(function(kv){r[kv[0]] = kv[1]})
	return r}

var send_mail = function(args){print(moment().toISOString(),'MAIL_SEND',args); Meteor.call('send_mail',args)}

// var doodle_poll_data = function(cb){exec('curl http://doodle.com/'+process.argv[3],function(e,v){cb(e,JSON.parse(v.match(/doodleJS.data.poll = (.+?);\s*doodleJS.data.poll.keywordsJson/)[1]))})}
// doodle_poll_data(function(e,v){print(v.participants.map(function(v){return _.pick(v,'name','preferences')}),v.optionsText)})

//===---------------------------===// main //===---------------------------===//

$.get('1on1 notification.mail',function(v){$('#template').val(v)})

var users

$('#users').on('change',function(){read_file($('#users')[0].files[0],function(e,v){csv_parse_keyed(v,function(e,v){users = v.map(user)._.indexBy('name')})})})
$('#send').on('click',function(){
	$('#send_cmds').val().trim().split('\n').map(function(v){
		var cmd = v.split(',').map(function(v){return v.trim()})
		var mail = mail_parse(template_expand($('#template').val(),template_eval({a:users[cmd[0]], b:users[cmd[1]], time:moment(cmd[2]).utc()})))
		send_mail(mail)
	})
})

})
