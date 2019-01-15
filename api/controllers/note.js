'use strict';

let mongoose = require('mongoose');
let Note = require('../models/note');

let config = require('../../configs/' + (process.env.NODE_ENV || "dev") + ".json");


exports.list_all_notes_by_user = function (req, res) {
    res.json({ success: true, notes: req.user.notes });
};

exports.create_notes = function (req, res) {
    var user = req.user;
    var inserted_notes = [];
    req.body.forEach(element => {
        var new_note = element;
        user.notes.push(new_note);
        inserted_notes.push(user.notes[user.notes.length - 1]);
    });
    user.save((err) => {
        if (err)
            res.json({ sucess: false, message: err });
        else {
            var result = [];
            inserted_notes.forEach(element => {
                var obj = element.toObject();
                obj.success = true;
                result.push(obj);
            });
            res.json(result);
        }
    });
};

exports.read_a_note = function (req, res) {
    var user = req.user;
    let note = user.notes.id(req.params.noteId);
    if (note) {
        let obj = note.toObject();
        obj.success = true;
        res.json(obj);
    }
    else {
        res.json({ success: false, message: 'Note id not found', _id: req.params.noteId });
    }
};

exports.update_a_note = function (req, res) {
    var user = req.user;
    let note = user.notes.id(req.params.noteId);
    if (note) {
        let id = note._id.toString();
        Object.assign(note, req.body)
        user.save((err) => {
            if (err)
                res.json({ success: false, message: err });
            else {
                let result = note.toObject();
                result.success = true;
                res.json(result);
            }
        });
    }
    else {
        res.json({ success: false, message: 'Note id not found', _id: req.params.noteId});
    }
};

exports.delete_a_note = function (req, res) {
    var user = req.user;
    let note = user.notes.id(req.params.noteId);
    if (note) {
        let id = note._id.toString();
        note.remove();
        user.save((err) => {
            if (err)
                res.json({ success: false, message: err });
            else
                res.json({ success: true, message: 'Note remove succefully', _id: id });
        });
    }
    else {
        res.json({ success: false, message: 'Note id not found', _id: req.params.noteId });
    }
};

exports.get_notes = function (req, res) {
    let notes = [];
    let user = req.user;
    req.body.forEach(element => {
        let note = user.notes.id(element._id);
        if (note)
        {
            let obj = note.toObject();
            obj.success = true;
            notes.push(obj);
        }
        else
            notes.push({success: false, message: "Note id not found", _id: element._id});
    });
    res.send(notes);
}

exports.update_notes = function (req, res) {
    let user = req.user;
    let result = [];
    req.body.forEach(element => {
        let note = user.notes.id(element._id);
        if (note)
        {
            let id = note.id;

            Object.assign(note, element);
            let obj = note.toObject();
            obj.success = true;
            result.push(obj);
        }
        else
            result.push({success: false, message: "Note id not found", _id: element._id});
    });
    user.save((err) => {
        if (err)
            res.json({success: false, message: err});
        else
            res.send(result);
    });
}

exports.delete_notes = function (req, res) {
    let user = req.user;
    let result = [];
    req.body.forEach(element => {
        let note = user.notes.id(element._id);
        if (note)
        {
            let id = note.id;
            note.remove();
            result.push({_id: id, success: true});
        }
        else
            result.push({success: false, message: "Note id not found", _id: element._id});
    });
    user.save((err) => {
        if (err)
            res.json({success: false, message: err});
        else
            res.send(result);
    });

}