// shadowsword#0179
const express = require('express') // front-end HTTP handler
const SHA256 = require('crypto-js/sha256') // Cryptography
const bcrypt = require('bcrypt') // User Cryptography
const saltRounds = 10; // for above

const bparse = require('body-parser') // https://codeforgeek.com/handle-get-post-request-express-4/
const cookies = require('cookie-parser') //https://stackoverflow.com/questions/16209145/how-to-set-cookie-in-node-js-using-express-framework
require("dotenv").config() // .env
const SERVER_PORT = process.env.APPLICATION_PORT, // :9030
      SERVER_URL = process.env.SERVER_URL, // To /
      SERVER_CDN = process.env.CDN; // Place where the img data is stored

const Sequelize = require('sequelize') // database management
const APPLICATION = express(); // runtime

const ff = require('fs') // dynamic
const fs = require("fs").promises; // static
let StartDate = new Date(); // time of app init

function generateHash(string){
  return SHA256(string).toString();
}

// db controller
const sqlite = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: './database.db',
})

// The User Data Structure
const Users = sqlite.define('users', {
  // USER ID (Generated)
  user_id: {
    type: Sequelize.STRING,
    unique: true,
  },
  // USER NAME (Defined)
  user_name: {
    type: Sequelize.STRING,
    defaultValue: 'Guest',
    allowNull: false,
  },
  // USER EMAIL (For Login Purposes)
  user_email: {
    type: Sequelize.STRING,
    defaultValue: 'unknown@unknown.ca',
    allowNull: false,
  },
  // USER HASH (The bcrypt hashed password)
  user_hash: {
    type: Sequelize.STRING,
    defaultValue: "0",
    allowNull: false,
  },
  // USER LEVEL, can be elevated with tokens
  user_level: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  // USER ADMINISTRATION PERMISSION LEVEL, zero is banned
  user_permission: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  // TOKENS Currency
  user_tokens: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  // REWARD FUTURE TIME VALUE (for token generation)
  reward_next_execution: {
    type: Sequelize.STRING,
    defaultValue: "0",
    allowNull: false,
  }
});

// Hash Rewards, can be shared.
const RewardDB = sqlite.define('rewarddb', {
  // User that ran generation process
  owner_id: {
    type: Sequelize.STRING,
    defaultValue: "0",
    allowNull: false,
  },
  // Generated Hash
  hash: {
    type: Sequelize.STRING,
    unique: true,
  },
  // Tokens Rewarded, [int] => 0
  tokens: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false,
  }
});

// Signature, an energy signature to an entity, etc., user-defined energy link
const Signatures = sqlite.define('sig', {
  // The unique generated hash, also used to generate glyph data
  sig_hash: {
    type: Sequelize.STRING,
    unique: true,
  },
  // NOUN = The PERSON (0), PLACE (1), or THING (2)
  // ALSO DEFINES THE CATEGORY FOR THE FRONT_ICON!
  sig_noun: {
    type: Sequelize.INTEGER,
    defaultValue: 2,
    allowNull: false,
  },
  // NAME = User defined.
  sig_name: {
    type: Sequelize.STRING,
    defaultValue: "A Strange Thing.",
    allowNull: false,
  },
  // VALUE = In Tokens. Default purchase value is 10.
  sig_value: {
    type: Sequelize.INTEGER,
    defaultValue: 10,
    allowNull: false,
  },
  // Description of signature
  sig_lore: {
    type: Sequelize.STRING,
    defaultValue: "Don't think too hard, you'll hurt yourself.",
    allowNull: false,
  },
  // SOME FLAGS THAT USERS CAN CONTROL.
  // LOCK Useful for permanently locking entries.
  sig_admin_lock: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  // User-Defined Icon, integer, from array of available icons
  front_icon: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  // The (O) Shield Switch
  front_shield: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  // Psychic Hazard Flash
  front_hazardsymbol: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  // Starfield
  front_starfield: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  }
})
Users.sync();
RewardDB.sync();
Signatures.sync();

// Activate Listener
APPLICATION.listen(
  SERVER_PORT,
  () => console.log(`Connection open @ localhost:${SERVER_PORT}`)
)

APPLICATION.use(express.json())
APPLICATION.use(bparse.urlencoded({ extended: true }));
APPLICATION.use(bparse.json());
APPLICATION.use(cookies())
APPLICATION.use('/favicon.ico', express.static('favicon.ico'));
APPLICATION.use('/robots.txt', express.static('robots.txt'));
APPLICATION.use(function(err, req, res, next) {
  console.error(err.stack);
  //res.status(500).send('500 PLEASE CONTACT ADMINISTRATOR')
})
