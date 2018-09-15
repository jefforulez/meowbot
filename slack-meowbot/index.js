
/* eslint-disable import/no-extraneous-dependencies */

//
// environment variables
//

require( 'dotenv' ).config() ;

const BOT_BOT_NAME           = process.env.BOT_BOT_NAME || 'meowbot' ;
const BOT_SLACK_API_TOKEN    = process.env.BOT_SLACK_API_TOKEN || '' ;
const BOT_LOG_LEVEL          = process.env.BOT_LOG_LEVEL || 'info' ;
const BOT_REDIS_URL          = process.env.BOT_REDIS_URL || 'redis://127.0.0.1:6379' ;
const BOT_RTM_LOG_LEVEL      = process.env.BOT_RTM_LOG_LEVEL || 'info' ;

const BOT_MEOW_HOSTNAME      = process.env.BOT_MEOW_HOSTNAME || 'meowbot.local' ;
const BOT_MEOW_MILLISECONDS  = process.env.BOT_MEOW_MILLISECONDS || '3000' ;

//
// globals
//

//
// winston setup
//

const winston = require( 'winston' ) ;

const logger = new ( winston.Logger )( {
  transports: [
    new ( winston.transports.Console )( {
      colorize: true,
      timestamp: ( new Date() ).toLocaleTimeString()
    } )
  ]
} ) ;

logger.level = BOT_LOG_LEVEL ;

//
// report environment
//

logger.info( 'starting bot with settings:' ) ;
logger.info( 'BOT_LOG_LEVEL:', BOT_LOG_LEVEL ) ;
logger.info( 'BOT_RTM_LOG_LEVEL: ', BOT_RTM_LOG_LEVEL ) ;
logger.info( 'BOT_REDIS_URL: ', BOT_REDIS_URL ) ;
logger.info( 'BOT_MEOW_HOSTNAME: ', BOT_MEOW_HOSTNAME ) ;
logger.info( 'BOT_MEOW_MILLISECONDS: ', BOT_MEOW_MILLISECONDS ) ;

//
// redis
//

const redis       = require( 'redis' ) ;
const redisClient = redis.createClient( BOT_REDIS_URL ) ;

redisClient.on( 'error', ( err ) => {
  logger.error( new Error( err ) ) ;
} ) ;

// client.set("string key", "string val", redis.print);

//
//
//

var request = require('request') ;

function meow()
{
  logger.info( 'meow()' ) ;

  let url = `http://${BOT_MEOW_HOSTNAME}/arduino/meow/${BOT_MEOW_MILLISECONDS}` ;

  request(
    url,
    ( error, response, body ) => {
      logger.info( `meow(), url: ${url}` ) ;
      logger.debug( 'error:', error ) ;
      logger.debug( 'statusCode:', response && response.statusCode ) ;
      logger.debug( 'body:', body ) ;
    }
  );
}

function meowWithSound()
{
  logger.info( 'meowWithSound()' ) ;

  let url = `http://${BOT_MEOW_HOSTNAME}/arduino/meowWithSound/${BOT_MEOW_MILLISECONDS}` ;

  request(
    url,
    ( error, response, body ) => {
      logger.info( `meow(), url: ${url}` ) ;
      logger.debug( 'error:', error ) ;
      logger.debug( 'statusCode:', response && response.statusCode ) ;
      logger.debug( 'body:', body ) ;
    }
  );
}

//
// rtm methods
//

const { RTMClient } = require( '@slack/client' ) ;

const rtm = new RTMClient(
  BOT_SLACK_API_TOKEN,
  {
    logLevel: BOT_RTM_LOG_LEVEL,
    dataStore: false
  }
) ;

let BOT_ID = null ;
let BOT_NAME = null ;

rtm.on( 'authenticated', ( rtmStartData ) => {
  BOT_ID = rtm.activeUserId ;
  BOT_NAME = rtmStartData.self.name ;
  logger.debug( 'rtm.on( authenticated )' ) ;
  logger.info( 'BOT_ID:', BOT_ID ) ;
  logger.info( 'BOT_NAME:', BOT_NAME ) ;
} ) ;

rtm.on( 'connected', () => {
  logger.debug( 'rtm.on( connected )' ) ;
} ) ;



rtm.on( 'reaction_added', ( message ) => {
  logger.info( 'rtm.on( reaction_added ), message:', message ) ;

  if ( message.item_user == BOT_ID ) {
    logger.info( 'rtm.on( reaction_added ), skipping reactions to my own messages' ) ;
    return ;
  }

  const catRegex = new RegExp( `_cat$` ) ;

  let r = message.reaction ;

  if (
    r === "tiger" ||
    r === "cat" ||
    r === "cat2" ||
    r === "crying_cat_face" ||
    r.match( catRegex )
  )
  {
    logger.debug( 'rtm.on( reaction_added ), matched reaction, reaction:', r ) ;

    let body = {
      type : 'message',
      channel : `${message.item.channel}`,
      thread_ts : `${message.item.ts}`,
      text : 'meow meow!'
    };

    rtm.addOutgoingEvent( true, 'message', body )
      .then( (res) => logger.info( 'Message sent: ', res ) )
      .catch( (error) => logger.error( error ) )
      ;

    ( r === "tiger" )
      ? meowWithSound()
      : meow()
      ;
  }

} ) ;



rtm.on( 'message', ( message ) => {
  logger.info( 'rtm.on( message ), message:', JSON.stringify( message ) ) ;

  // TODO: handle edits, et al - https://api.slack.com/events/message

  if ( message.subtype === 'channel_join' )
  {
    logger.debug( 'rtm.on( message ), subtype:', message.subtype ) ;

    let body = {
      type : 'message',
      channel : `${message.channel}`,
      text : `hello! ask me to \`meow\` and maybe i'll sing you a song`
    };

    rtm.addOutgoingEvent( true, 'message', body )
      .then( (res) => logger.info( 'Message sent: ', res ) )
      .catch( (error) => logger.error( error ) )
      ;

    return ;
  }

  if ( message.subtype || ! message.user ) {
    logger.debug( 'rtm.on( message ), ignoring subtype message, subtype:', message.subtype ) ;
    return ;
  }

  if ( message.channel.match( /^D/ ) )
  {
    logger.debug( 'rtm.on( message ), received direct message' ) ;

    switch ( message.text ) {

      case 'meow' :
        rtm.sendMessage( 'meow!', message.channel ) ;
        meow() ;
        break ;

      case 'status' :
        rtm.sendMessage( `\`\`\`meow_hostname: ${BOT_MEOW_HOSTNAME}\nmeow_milliseconds: ${BOT_MEOW_MILLISECONDS}\`\`\``, message.channel ) ;
        break ;

      case 'help' :
      default :
        rtm.sendMessage(
          `tell me to \`meow\` and i'll sing you a song`,
          message.channel
        ) ;
    }

    return ;
  }

  const mentionRegex = new RegExp( `<@${BOT_ID}>` ) ;
  const meowRegex = new RegExp( '\\bmeow\\b', 'im' ) ;

  if ( message.text.match( meowRegex ) ) {
    logger.debug( 'rtm.on( message ), matched meowRegex' )
  }

  if ( message.text.match( mentionRegex ) )
  {
    logger.debug( 'rtm.on( message ), matched mentionRegex' ) ;

    let text = `tell me to \`meow\` and i'll sing you a song` ;

    if ( message.text.match( meowRegex ) ) {
      logger.debug( 'rtm.on( message ), matched meowRegex' )
      text = 'meow!'
      meow()
    }
    else
    {
      logger.debug( `rtm.on( message ), message.text: '${message.text}'` )
    }

    let body = {
      type : 'message',
      channel : `${message.channel}`,
      thread_ts : `${message.thread_ts || message.ts}`,
      text : `${text}`
    } ;

    rtm.addOutgoingEvent( true, 'message', body )
      .then( (res) => logger.info( 'Message sent: ', res ) )
      .catch( (error) => logger.error( error ) )
      ;

  }

  return ;
} ) ;

//
// main()
//

if ( ! BOT_SLACK_API_TOKEN ) {
  logger.error( new Error( '!!! Error: Please set BOT_SLACK_API_TOKEN in the app environment.' ) ) ;
  process.exit( 1 ) ;
}

rtm.start() ;
