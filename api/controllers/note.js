'use strict';

let mongoose = require('mongoose');
let Note = require('../models/note');

let config = require('../../configs/' + (process.env.NODE_ENV || "dev") + ".json");


exports.list_all_notes_by_user = function (req, res) {
    let note_list = [];
    Note.find({user: req.user._id}).exec((err, notes) => {
        notes.forEach((note) => {
            note_list.push(note.toJSON());
        });
        res.json({ success: true, notes: note_list });
    });
};

exports.create_notes = function (req, res) {
    var inserted_notes = [];

    function response(){
        if (inserted_notes.length == req.body.length)
            res.json(inserted_notes);
    }
    
    req.body.forEach(element => {
        element.user = req.user._id;
        var new_note = new Note(element);
        new_note.save((err, note) => {
            if (err)
            {
                let s_note = element.clone()
                s_note.success = false;
                inserted_notes.push(s_note);
            }
            else
            {
                let s_note = note.toJSON()
                s_note.success = true;
                inserted_notes.push(s_note);
            }
            response();
        });
    });
    
};

exports.read_a_note = function (req, res) {
    var user = req.user;
    let note = Note.findOne({_id: req.params.noteId, user: user._id}).exec((err, note) => {
        if (err)
            res.json({ success: false, message: 'Note id not found', _id: req.params.noteId });
        else
        {
            let obj = note.toJSON();
            obj.success = true;
            res.json(obj);
        }    
    });
};

exports.update_a_note = function (req, res) {
    delete req.body._id;

    let modify = { $set : req.body };

    Note.findOne({_id: req.params.noteId, user: req.user._id}, (err, note) => {
            if (err)
                res.json({ success: false, message: "Note id not found", _id: req.params.noteId});
            else {
                for (let [key, val] of Object.entries(req.body)){
                    note[key] = val;
                }

                note.save((err, new_note) => {
                    if (err)
                    {
                        res.json({ success: false, message: err.message, _id: req.params.noteId});
                    }
                    else
                    {
                        let result = new_note.toObject();
                        result.success = true;
                        res.json(result);
                    }
                });
            }
        });
};

exports.delete_a_note = function (req, res) {
    Note.findOneAndDelete({_id: req.params.noteId, user: req.user._id}, (err, note) => {
        if (err)
            if (err.name == "CastError" && err.kind == "ObjectId")
                res.json({ success: false, message: "Note id not found", _id: req.params.noteId});
            else
                res.json({ success: false, message: "On delete error", _id: req.params.noteId });          
        else
            res.json({ success: true, message: 'Note remove succefully', _id: note.id });
    });
};

exports.get_notes = function (req, res) {

    let result_final = new Array(req.body.length);
    
    
    let i = 0;
    function done(result, index)
    {
        i++;
        result_final[index] = result;
        if (i == req.body.length)
        {
            res.send(result_final);
        }
    }

    req.body.forEach((obj, i) => {
        Note.findOne({_id: obj._id, user: req.user._id}).exec((err, note) => {
            if (err)
            {
                done({success: false, message: "Note id not found", _id: obj._id}, i)
            }
            else
            {
                if (note)
                {
                    let n = note.toJSON()
                    n.success = true
                    done(n, i)
                }
                else
                {
                    done({success: false, message: "Note id not found", _id: obj._id}, i)
                }
            }
            
        })
    })
}

exports.update_notes = function (req, res) {

    let result_final = new Array(req.body.length);
    

    let i = 0;
    function done(result, index)
    {
        i++;
        result_final[index] = result;
        if (i == req.body.length)
        {
            res.send(result_final);
        }
    }

    req.body.forEach((note_req, i) => {
        Note.findOne({_id: note_req._id, user: req.user._id}, (err, note) => {

            if (err)
            {
                done({success: false, message: "Note id not found", _id: note_req._id}, i)
            }
            else
            {
                delete note_req._id
                for (let [key, val] of Object.entries(note_req)){
                    note[key] = val;
                }
                note.save((err, new_note) => {
                    if (err)
                    {
                        done({success: false, message: "Failed to update note", _id: note.id}, i);
                    }
                    else
                    {
                        let result = new_note.toJSON();
                        result.success = true;
                        done(result, i);
                    }
                });
            }
        });
    });
}

exports.delete_notes = function (req, res) {
    let result_final = new Array(req.body.length);
    

    let i = 0;
    function done(result, index)
    {
        i++;
        result_final[index] = result;
        if (i == req.body.length)
        {
            res.send(result_final);
        }
    }

    req.body.forEach((note_to_delete, i) => {
        Note.findOneAndDelete({_id: note_to_delete._id, user: req.user._id}, (err, note) => {
            if (err)
                if (err.name == "CastError" && err.kind == "ObjectId")
                    done({ success: false, message: "Note id not found", _id: note_to_delete._id }, i);
                else
                    done({ success: false, message: "On delete error", _id: note_to_delete._id }, i);          
            else
                done({ success: true, message: 'Note remove succefully', _id: note.id }, i);
        });
        /*Note.findOneAndRemove({$and: [{user: req.user.id}, {_id: note_to_delete._id}]}, (err, user) => {
            if (err)
            {
                done({success: false, message: "Note id not found", _id: note_to_delete._id}, i)
            }
            else
            {
                done({success: true, message: "Remove successfully", _id: note_to_delete._id}, i)
            }
        });*/
        /*Note.findOneAndRemove({_id: note_to_delete._id, user: req.user.id}).exec((err, user) => {
            if (err)
            {
                done({success: false, message: "Note id not found", _id: note_to_delete._id}, i)
            }
            else
            {
                done({success: true, message: "Remove successfully", _id: note_to_delete._id}, i)
            }
        });*/
    });

}