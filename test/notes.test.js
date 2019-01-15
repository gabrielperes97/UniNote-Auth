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

    //esvazia o banco a cada teste
    beforeEach((done) => {
        User.remove({}, (err) => {
            user = new User(user_example);
            user.save((err) => {
                done();
            });
        });
    });

    describe("/GET note", () => {
        it("Listar todas as notas inseridas", (done) => {
            let notes_before = [
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
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
            });

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
                        res.body.notes[i].should.have.property('title').eql(notes_before[i].title);
                        res.body.notes[i].should.have.property('content').eql(notes_before[i].content);
                        res.body.notes[i].should.have.property('background_color').eql(notes_before[i].background_color);
                        res.body.notes[i].should.have.property('font_color').eql(notes_before[i].font_color);
                        res.body.notes[i].should.have.property('created_date');
                        res.body.notes[i].should.have.property('last_update');
                    }
                    done();
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

            chai.request(server)
                .post("/note")
                .set("authorization", token)
                .send(notes)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
                    for (var i = 0; i < 3; i++) {
                        res.body[i].should.have.property('success').eql(true);
                        res.body[i].should.have.property('title').eql(notes[i].title);
                        res.body[i].should.have.property('content').eql(notes[i].content);
                        res.body[i].should.have.property('background_color').eql(notes[i].background_color);
                        res.body[i].should.have.property('font_color').eql(notes[i].font_color);
                        res.body[i].should.have.property('created_date');
                        res.body[i].should.have.property('last_update');
                    }
                    done();
                });
        });

        it("Inserir notas com o banco já contendo algumas", (done) => {
            let notes_before = [
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
            notes_before.forEach(element => {
                var note = new Note(element);
                console.log("Before insert: " + element.user)
                note.save((err) => {
                    done();
                });
            });
            
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

            chai.request(server)
                .post("/note")
                .set("authorization", token)
                .send(notes)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
                    for (var i = 0; i < 3; i++) {
                        res.body[i].should.have.property('success').eql(true);
                        res.body[i].should.have.property('title').eql(notes[i].title);
                        res.body[i].should.have.property('content').eql(notes[i].content);
                        res.body[i].should.have.property('background_color').eql(notes[i].background_color);
                        res.body[i].should.have.property('font_color').eql(notes[i].font_color);
                        res.body[i].should.have.property('created_date');
                        res.body[i].should.have.property('last_update');
                    }
                    done();
                });
        });
    });

    describe("/GET/:id note", () => {
        it("Recuperar uma nota", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

            
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

        });

        it("Recuperar uma nota inexistente", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
            });

            
            //Realiza o login
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

    describe("/DELETE/:id note", () => {
        it("Remover uma nota", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

            
            //Realiza o login
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
                    User.findById(test_note.__parent.id).exec((err, new_user) => {
                        new_user.notes.length.should.be.eql(2);
                        should.not.exist(new_user.notes.id(test_note.id));
                        done();
                    });
                });
        
        });

        it("Falha ao remover nota", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
            });

            
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

                    User.findById(user.id).exec((err, new_user) => {
                        new_user.notes.length.should.be.eql(3);
                        done();
                    });
                });
        
        });
    });

    describe("/PUT/:id note", () => {
        it("Atualizar nota", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

            
            //Realiza o login
            let payload = { id: user._id };
            let token = jwt.encode(payload, config.jwtSecret);
            let test_note = notes[1];
            let update = {
                content: "123456789"
            };

            chai.request(server)
                .put("/note/" + test_note.id)
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
                    User.findById(user.id).exec((err, new_user) => {
                        note_updated = new_user.notes.id(test_note.id);
                        res.body.should.have.property('last_update').eql(note_updated.last_update.toISOString());
                        note_updated.content.should.be.eql(update.content);
                        done();
                    });
                });

        
        });

        it("Atualizar nota errada", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
            });

            
            //Realiza o login
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

    describe("/POST notes", () => {
        it("Recuperar notas em lote", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

            
            //Realiza o login
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

            chai.request(server)
                .post("/notes")
                .set("authorization", token)
                .send(requested_notes)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(2);
                    for (var i = 0; i < 2; i++) {
                        note = notes.id(requested_notes[i]._id);
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

        it("Recuperar notas em lote com uma nota inexistente", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

        
            //Realiza o login
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

            chai.request(server)
                .post("/notes")
                .set("authorization", token)
                .send(requested_notes)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
                    for (var i = 0; i < 2; i++) {
                        note = notes.id(requested_notes[i]._id);
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

    describe("/PUT notes", () => {
        it("Atualizar notas em lote", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = []
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

        
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

                    User.findById(user.id).exec((err, new_user) => {
                        for (var i = 0; i < 3; i++) {
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
                        done();
                    });
                });
        });

        it("Atualizar uma nota existente e uma inexistente", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

            
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

        it("Quando atualizar uma nota, o campo last_update deve atualizar automaticamente", done => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            let notes = [];
            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note);
            });

        
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

                    User.findById(user.id).exec((err, new_user) => {
                        for (var i = 0; i < 3; i++) {
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

                            old_note = user.notes.id(update[i]._id);
                            old_note.last_update.toISOString().should.be.not.eql(note.last_update.toISOString());
                        }
                        done();
                    });
                });
        });
    });

    describe("/DELETE notes", () => {
        it("Remover notas em lote", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            notes = [];

            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note)
            });


            //Realiza o login
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
                    User.findById(user.id).exec((err, new_user) => {
                        new_user.notes.length.should.be.eql(1);
                        should.not.exist(new_user.notes.id(notes_to_delete[0]._id));
                        should.not.exist(new_user.notes.id(notes_to_delete[1]._id));
                        done();
                    });
                });
        });

        it("Remover uma nota existente e uma não existente", (done) => {
            let notes_before = [
                {
                    title: "Materias",
                    content: "Portugues\nMatematica",
                    background_color: "#000",
                    font_color: "#FFF"
                },

                {
                    title: "Numeros",
                    content: "456789",
                    background_color: "#111",
                    font_color: "#EEE"
                },
                {
                    title: "Palavras",
                    content: "Olho, brinco",
                    background_color: "#222",
                    font_color: "#GGG"
                }
            ];

            notes = [];

            notes_before.forEach(element => {
                var note = new Note(element);
                note.save((err) => {
                    done();
                });
                notes.push(note)
            });

        
            //Realiza o login
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
            
                    User.findById(user.id).exec((err, new_user) => {
                        new_user.notes.length.should.be.eql(2);
                        should.not.exist(new_user.notes.id(notes_to_delete[0]._id));
                        done();
                    });
                });
        });
    });



});