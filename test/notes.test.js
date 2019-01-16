process.env.NODE_ENV = "test";
mongoose = require("mongoose");
User = require('../api/models/user');
Note = require('../api/models/note');
const superagent = require('superagent');

chai = require("chai")
chaiHttp = require("chai-http");
server = require("../server");
should = chai.should();
let bcrypt = require("bcrypt");
let jwt = require("jwt-simple");
let config = require('../configs/' + (process.env.NODE_ENV || "dev") + ".json");

chai.use(chaiHttp);

describe("Notes", () => {

    let user_example = {
        firstname: "Gabriel",
        lastname: "Peres",
        username: "gabrielperes",
        password: bcrypt.hashSync("123321", 10),
        email: "gabriel@peres.com",
    }
    var user = null;
    var note_before = null;

    //esvazia o banco a cada teste
    beforeEach((done) => {
        var i = 0;
        function ready()
        {
            i++;
            if (i == 2)
                done();
        }
        Note.remove({}, (err) => {
            ready();
        });
        User.remove({}, (err) => {
            user = new User(user_example);
            user.save((err) => {
                if (err)
                    ready(new Error(err.toString()));
                else
                {
                    notes_before = [
                        {
                            title: "Materias",
                            content: "Portugues\nMatematica",
                            background_color: "#000",
                            font_color: "#FFF",
                            user: user._id
                        },
                
                        {
                            title: "Numeros",
                            content: "456789",
                            background_color: "#111",
                            font_color: "#EEE",
                            user: user._id
                        },
                        {
                            title: "Palavras",
                            content: "Olho, brinco",
                            background_color: "#222",
                            font_color: "#GGG",
                            user: user._id
                        }
                    ];
                    ready();
                }           
            });
        });
        
    });

    /**
     * 
     * @param {function(array)} done 
     * 
     */
    function insertNormal3Notes(done)
    {
        let notes = []

        function ready()
        {
            if (notes.length == notes_before.length)
                done(notes);
        }

        notes_before.forEach(element => {
            var note = new Note(element);
            note.save((err, n) => {
                if (! err)
                {
                    notes.push(n);
                    ready();
                }
            });
        });
    }

    describe("/GET note", () => {
        it("Listar todas as notas inseridas", (done) => {
            insertNormal3Notes((notes) => {
                let notes_obj = {};
                notes.forEach((n) => {
                    notes_obj[n._id] = n;
                }); 
                notes = notes_obj;

                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                chai.request(server)
                    .get("/note")
                    .set("authorization", token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.notes.should.be.a('array');
                        res.body.notes.length.should.be.eql(3);
                        for (var i = 0; i < 3; i++) {
                            note = notes_obj[res.body.notes[i]._id];
                            res.body.notes[i].should.have.property('title').eql(note.title);
                            res.body.notes[i].should.have.property('content').eql(note.content);
                            res.body.notes[i].should.have.property('background_color').eql(note.background_color);
                            res.body.notes[i].should.have.property('font_color').eql(note.font_color);
                            res.body.notes[i].should.have.property('created_date');
                            res.body.notes[i].should.have.property('last_update');
                        }
                        done();
                    });
            });            
        });

        it("Usuário não tem notas", done => {
            let payload = { id: user._id };
            let token = jwt.encode(payload, config.jwtSecret);
            chai.request(server)
                .get("/note")
                .set("authorization", token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.notes.should.be.a('array');
                    res.body.notes.length.should.be.eql(0);
                    done();
                });
        });
    });

    describe("/POST note", () => {
        it("Inserir uma nota", (done) => {
            //Realiza o login
            let payload = { id: user._id };
            let token = jwt.encode(payload, config.jwtSecret);

            let note =
                [
                    {
                        title: "Datas",
                        content: "11/05/2037 - Não quero nem sabe com quantos anos eu vou chegar",
                        background_color: "#000",
                        font_color: "#FFF"
                    }
                ];

            chai.request(server)
                .post("/note")
                .set("authorization", token)
                .send(note)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.have.property('success').eql(true);
                    res.body[0].should.have.property('title').eql(note[0].title);
                    res.body[0].should.have.property('content').eql(note[0].content);
                    res.body[0].should.have.property('background_color').eql(note[0].background_color);
                    res.body[0].should.have.property('font_color').eql(note[0].font_color);
                    res.body[0].should.have.property('created_date');
                    res.body[0].should.have.property('last_update');
                    done();
                });
        });

        it("Inserir 3 notas", (done) => {
            //Realiza o login
            let payload = { id: user._id };
            let token = jwt.encode(payload, config.jwtSecret);

            let notes = [
                {
                    title: "Datas",
                    content: "11/05/2037 - Não quero nem sabe com quantos anos eu vou chegar",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "A fazer",
                    content: "*Ir no banco\nIr no cabelereiro",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Lembrete",
                    content: "Verificar site do banco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes_obj = {};
            notes.forEach((n) => {
                notes_obj[n.title] = n;
            }); 

            chai.request(server)
                .post("/note")
                .set("authorization", token)
                .send(notes)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
                    for (var i = 0; i < 3; i++) {
                        note = notes_obj[res.body[i].title]
                        res.body[i].should.have.property('success').eql(true);
                        res.body[i].should.have.property('title').eql(note.title);
                        res.body[i].should.have.property('content').eql(note.content);
                        res.body[i].should.have.property('background_color').eql(note.background_color);
                        res.body[i].should.have.property('font_color').eql(note.font_color);
                        res.body[i].should.have.property('created_date');
                        res.body[i].should.have.property('last_update');
                    }
                    done();
                });
        });

        it("Inserir notas com o banco já contendo algumas", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                let new_notes = [
                    {
                        title: "Datas",
                        content: "11/05/2037 - Não quero nem sabe com quantos anos eu vou chegar",
                        background_color: "#000",
                        font_color: "#FFF"
                    },

                    {
                        title: "A fazer",
                        content: "*Ir no banco\nIr no cabelereiro",
                        background_color: "#111",
                        font_color: "#EEE"
                    },
                    {
                        title: "Lembrete",
                        content: "Verificar site do banco",
                        background_color: "#222",
                        font_color: "#GGG"
                    }
                ];

                let notes_obj = {};
                new_notes.forEach((n) => {
                    notes_obj[n.title] = n;
                }); 

                chai.request(server)
                    .post("/note")
                    .set("authorization", token)
                    .send(new_notes)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(3);
                        for (var i = 0; i < 3; i++) {
                            note = notes_obj[res.body[i].title]
                            res.body[i].should.have.property('success').eql(true);
                            res.body[i].should.have.property('title').eql(note.title);
                            res.body[i].should.have.property('content').eql(note.content);
                            res.body[i].should.have.property('background_color').eql(note.background_color);
                            res.body[i].should.have.property('font_color').eql(note.font_color);
                            res.body[i].should.have.property('created_date');
                            res.body[i].should.have.property('last_update');
                        }
                        done();
                    });
            }); 
        });
    });

    describe("/GET/:id note", () => {
        it("Recuperar uma nota", (done) => {
            
            insertNormal3Notes((notes) => {
                //Realiza o login
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let test_note = notes[1];
                chai.request(server)
                    .get("/note/" + test_note._id)
                    .set("authorization", token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(true);
                        res.body.should.have.property('_id').eql(test_note._id.toString());
                        res.body.should.have.property('title').eql(test_note.title);
                        res.body.should.have.property('content').eql(test_note.content);
                        res.body.should.have.property('background_color').eql(test_note.background_color);
                        res.body.should.have.property('font_color').eql(test_note.font_color);
                        res.body.should.have.property('created_date');
                        res.body.should.have.property('last_update');
                        done();
                    });
            })
            
            

        });

        it("Recuperar uma nota inexistente", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                chai.request(server)
                    .get("/note/" + "1234") //fake id
                    .set("authorization", token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(false);
                        res.body.should.have.property('_id').eql("1234");
                        res.body.should.have.property('message').eql("Note id not found");
                        done();
                    });
            });           
        });
    });

    describe("/DELETE/:id note", () => {
        it("Remover uma nota", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let test_note = notes[1];
                chai.request(server)
                    .delete("/note/" + test_note._id)
                    .set("authorization", token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(true);
                        res.body.should.have.property('_id').eql(test_note._id.toString());
                        res.body.should.have.property('message').eql("Note remove succefully");
                        Note.findById(test_note._id).exec((err, note) => {
                            should.not.exist(note);
                            done();
                        });
                    });
            });
        });

        it("Falha ao remover nota", (done) => {
            insertNormal3Notes((notes) => {
                //Realiza o login
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                chai.request(server)
                    .delete("/note/" + 1234)//Fake ID
                    .set("authorization", token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(false);
                        res.body.should.have.property('message').eql("Note id not found");
                        res.body.should.have.property('_id').eql("1234");

                        Note.find({}).exec((err, notes) => {
                            notes.length.should.be.eql(3);
                            done();
                        });
                    });
            });        
        });
    });

    describe("/PUT/:id note", () => {
        it("Atualizar nota", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let test_note = notes[1];
                let update = {
                    content: "123456789"
                };

                chai.request(server)
                    .put("/note/" + test_note._id)
                    .set("authorization", token)
                    .send(update)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(true);
                        res.body.should.have.property('_id').eql(test_note.id);
                        res.body.should.have.property('title').eql(test_note.title);
                        res.body.should.have.property('content').eql(update.content); //Updated field
                        res.body.should.have.property('background_color').eql(test_note.background_color);
                        res.body.should.have.property('font_color').eql(test_note.font_color);
                        res.body.should.have.property('created_date').eql(test_note.created_date.toISOString());
                        Note.findById(test_note.id).exec((err, new_note) => {
                            res.body.should.have.property('last_update').eql(new_note.last_update.toISOString());
                            new_note.content.should.be.eql(update.content);
                            done();
                        });
                    });
            });        
        });

        it("Atualizar nota errada", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let update = {
                    content: "123456789"
                };

                chai.request(server)
                    .put("/note/" + "1234")//fake id
                    .set("authorization", token)
                    .send(update)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('success').eql(false);
                        res.body.should.have.property('_id').eql("1234");
                        res.body.should.have.property('message').eql("Note id not found");
                        done();
                    });
            });
        });
    });

    describe("/POST notes", () => {
        it("Recuperar notas em lote", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                let requested_notes = [
                    {
                        _id: notes[0].id
                    },
                    {
                        _id: notes[2].id
                    }
                ];

                r_notes = [notes[0], notes[2]];

                chai.request(server)
                    .post("/notes")
                    .set("authorization", token)
                    .send(requested_notes)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(2);
                        for (var i = 0; i < 2; i++) {
                            note =  r_notes[i];
                            res.body[i].should.have.property('success').eql(true);
                            res.body[i].should.have.property('_id').eql(note.id);
                            res.body[i].should.have.property('title').eql(note.title);
                            res.body[i].should.have.property('content').eql(note.content);
                            res.body[i].should.have.property('background_color').eql(note.background_color);
                            res.body[i].should.have.property('font_color').eql(note.font_color);
                            res.body[i].should.have.property('created_date').eql(note.created_date.toISOString());
                            res.body[i].should.have.property('last_update').eql(note.last_update.toISOString());
                        }
                        done();
                    });
            });
        });

        it("Recuperar notas em lote com uma nota inexistente", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                let requested_notes = [
                    {
                        _id: notes[0].id
                    },
                    {
                        _id: notes[2].id
                    },
                    {
                        _id: "123" //fake id
                    }
                ];

                let r_notes = [notes[0], notes[2]]

                chai.request(server)
                    .post("/notes")
                    .set("authorization", token)
                    .send(requested_notes)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(3);
                        for (var i = 0; i < 2; i++) {
                            note = r_notes[i];
                            res.body[i].should.have.property('success').eql(true);
                            res.body[i].should.have.property('_id').eql(note.id);
                            res.body[i].should.have.property('title').eql(note.title);
                            res.body[i].should.have.property('content').eql(note.content);
                            res.body[i].should.have.property('background_color').eql(note.background_color);
                            res.body[i].should.have.property('font_color').eql(note.font_color);
                            res.body[i].should.have.property('created_date').eql(note.created_date.toISOString());
                            res.body[i].should.have.property('last_update').eql(note.last_update.toISOString());
                        }
                        res.body[2].should.have.property('success').eql(false);
                        res.body[2].should.have.property('_id').eql(requested_notes[2]._id);
                        res.body[2].should.have.property('message').eql("Note id not found");
                        done();
                    });
            }); 
        });
    });

    describe("/PUT notes", () => {
        it("Atualizar notas em lote", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                
                let update = [
                    {
                        _id: notes[0].id,
                        title: "Materias para estudar"
                    },
                    {
                        _id: notes[1].id,
                        content: '123456'
                    },
                    {
                        _id: notes[2].id,
                        background_color: "#333"
                    }
                ];

                chai.request(server)
                    .put("/notes")
                    .set("authorization", token)
                    .send(update)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("array");
                        res.body.length.should.be.eql(3);

                        notes_before[0].title = update[0].title;
                        notes_before[1].content = update[1].content;
                        notes_before[2].background_color = update[2].background_color;

                        var steps = 0;
                        function step()
                        {
                            steps++;
                            if (steps == 3)
                                done();
                        }

                        res.body.forEach((note, i) => {
                            let before = notes_before[i]
                            Note.findById(note._id).exec((err, new_note) => {
                                note.should.have.property('success').eql(true);
                                note.should.have.property('_id').eql(note._id);
                                note.should.have.property('title').eql(before.title);
                                note.should.have.property('content').eql(before.content); //Updated field
                                note.should.have.property('background_color').eql(before.background_color);
                                note.should.have.property('font_color').eql(before.font_color);
                                note.should.have.property('created_date');
                                note.should.have.property('last_update');

                                new_note.id.should.be.eql(note._id);
                                new_note.title.should.be.eql(before.title);
                                new_note.content.should.be.eql(before.content);
                                new_note.background_color.should.be.eql(before.background_color);
                                new_note.font_color.should.be.eql(before.font_color);
                                step();
                            });
                        });
                    });
            }); 
        });

        it("Atualizar uma nota existente e uma inexistente", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                let update = [
                    {
                        _id: notes[0]._id,
                        title: "Materias para estudar"
                    },
                    {
                        _id: notes[1]._id,
                        content: '123456'
                    },
                    {
                        _id: "456",
                        background_color: "#333"
                    }
                ];

                chai.request(server)
                    .put("/notes")
                    .set("authorization", token)
                    .send(update)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("array");
                        res.body.length.should.be.eql(3);

                        notes_before[0].title = update[0].title;
                        notes_before[1].content = update[1].content;
                        notes_before[2].background_color = update[2].background_color;

                        User.findById(user.id).exec((err, new_user) => {
                            for (var i = 0; i < 2; i++) {
                                res.body[i].should.have.property('success').eql(true);
                                res.body[i].should.have.property('_id').eql(update[i]._id);
                                res.body[i].should.have.property('title').eql(notes_before[i].title);
                                res.body[i].should.have.property('content').eql(notes_before[i].content); //Updated field
                                res.body[i].should.have.property('background_color').eql(notes_before[i].background_color);
                                res.body[i].should.have.property('font_color').eql(notes_before[i].font_color);
                                res.body[i].should.have.property('created_date');
                                res.body[i].should.have.property('last_update');
                                
                                note = new_user.notes.id(update[i]._id);
                                note.id.should.be.eql(update[i]._id);
                                note.title.should.be.eql(notes_before[i].title);
                                note.content.should.be.eql(notes_before[i].content);
                                note.background_color.should.be.eql(notes_before[i].background_color);
                                note.font_color.should.be.eql(notes_before[i].font_color);
                            }
                            res.body[2].should.have.property('success').eql(false);
                            res.body[2].should.have.property('_id').eql(update[2]._id);
                            res.body[2].should.have.property('message').eql("Note id not found");
                            done();
                        });
                    });
            }); 
        });

        it("Quando atualizar uma nota, o campo last_update deve atualizar automaticamente", done => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);

                let update = [
                    {
                        _id: notes[0].id,
                        title: "Materias para estudar"
                    },
                    {
                        _id: notes[1].id,
                        content: '123456'
                    },
                    {
                        _id: notes[2].id,
                        background_color: "#333"
                    }
                ];

                chai.request(server)
                    .put("/notes")
                    .set("authorization", token)
                    .send(update)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("array");
                        res.body.length.should.be.eql(3);

                        notes_before[0].title = update[0].title;
                        notes_before[1].content = update[1].content;
                        notes_before[2].background_color = update[2].background_color;

                        var steps = 0;
                        function step()
                        {
                            steps++;
                            if (steps == 3)
                                done();
                        }

                        res.body.forEach((note, i) => {
                            let before = notes_before[i]
                            Note.findById(note._id).exec((err, new_note) => {
                                note.should.have.property('success').eql(true);
                                note.should.have.property('_id').eql(note._id);
                                note.should.have.property('title').eql(before.title);
                                note.should.have.property('content').eql(before.content); //Updated field
                                note.should.have.property('background_color').eql(before.background_color);
                                note.should.have.property('font_color').eql(before.font_color);
                                note.should.have.property('created_date');
                                note.should.have.property('last_update');

                                new_note.id.should.be.eql(note._id);
                                new_note.title.should.be.eql(before.title);
                                new_note.content.should.be.eql(before.content);
                                new_note.background_color.should.be.eql(before.background_color);
                                new_note.font_color.should.be.eql(before.font_color);

                                notes[i].last_update.toISOString().should.be.not.eql(new_note.last_update.toISOString());
                                step();
                            });
                        });

                    });
            });   
        });
    });

    describe("/DELETE notes", () => {
        it("Remover notas em lote", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let notes_to_delete = [
                    {
                        _id: notes[0].id
                    },
                    {
                        _id: notes[2].id
                    }
                ];

                chai.request(server)
                    .delete("/notes")
                    .set("authorization", token)
                    .send(notes_to_delete)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(2);
                        for (var i = 0; i < 1; i++) {
                            res.body[i].should.have.property('success').eql(true);
                            res.body[i].should.have.property('_id').eql(notes_to_delete[i]._id);
                        }
                        User.find({$or: [{_id: notes_to_delete[0]._id}, {_id: notes_to_delete[1]._id} ]}).exec((err, founded_users) => {
                            founded_users.length.should.be.eql(0);
                            done();
                        });
                    });
            });
        });

        it("Remover uma nota existente e uma não existente", (done) => {
            insertNormal3Notes((notes) => {
                let payload = { id: user._id };
                let token = jwt.encode(payload, config.jwtSecret);
                let notes_to_delete = [
                    {
                        _id: notes[0].id
                    },
                    {
                        _id: "123654" //fake id
                    }
                ];

                chai.request(server)
                    .delete("/notes")
                    .set("authorization", token)
                    .send(notes_to_delete)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(2);

                        res.body[0].should.have.property('success').eql(true);
                        res.body[0].should.have.property('_id').eql(notes_to_delete[0]._id);

                        res.body[1].should.have.property('success').eql(false);
                        res.body[1].should.have.property('_id').eql(notes_to_delete[1]._id);
                        res.body[1].should.have.property('message').eql("Note id not found");
                
                        Note.findById(notes_to_delete[0]._id).exec((err, new_note) => {
                            should.not.exist(new_note);
                            done();
                        });
                    });
            });
        });
    });



});