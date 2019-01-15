'use strict';

const auth = require("../../auth");

module.exports = function(app) {
    var notes = require('../controllers/note');

    app.route('/note')
        .get(auth(), notes.list_all_notes_by_user)
        .post(auth(), notes.create_notes);
    
    app.route('/note/:noteId')
        .get(auth(), notes.read_a_note)
        .put(auth(), notes.update_a_note)
        .delete(auth(), notes.delete_a_note);

    app.route('/notes')
        .post(auth(), notes.get_notes)
        .put(auth(), notes.update_notes)
        .delete(auth(), notes.delete_notes);
};