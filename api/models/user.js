'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var userSchema = new Schema ({
    firstname: {
        type: String,
        required: true
    },

    lastname: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    last_update: {
        type: Date,
        default: Date.now
    },

    created_date: {
        type: Date,
        default: Date.now
    },

    isAdmin: { 
        type: Boolean,
        default: false
    }
});

userSchema.pre('save', function (next) {
    this.last_update = Date.now();
    next();
});

module.exports = mongoose.model('Users', userSchema);