var n1qlController = require("../controller/n1ql.js");
var crud = require("../controller/crud.js");

module.exports = function (app) {


     app.post('/api/v1/find', function (req, res) {
        if (!req.body.Query) {
          res.json({ Error: 'Bad Request.', Code: 400 });
        } else {
            var Material = req.body.Query;
            n1qlController.find(Material, function(resp) {
              res.json(resp);
            });
        }
     });

     app.post('/api/v1/upsert', function (req, res) {
      if (!req.body.key) {
        res.json({ Error: 'Bad Request.', Code: 400 });
      } else {
        crud.upsert(req.body.key, req.body.doc, (resp) => {
          res.json(resp);
        })
      }
   });

   app.post('/api/v1/get', function (req, res) {
    if (!req.body.key) {
      res.json({ Error: 'Bad Request.', Code: 400 });
    } else {
      crud.get(req.body.key, (resp) =>{
        res.json(resp);
      });
    }
 });

 app.post('/api/v1/remove', function (req, res) {
  if (!req.body.key) {
    res.json({ Error: 'Bad Request.', Code: 400 });
  } else {
    crud.remove(req.body.key, (resp) =>{
      res.json(resp);
    });
  }
});




}