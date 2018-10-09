const express = require("express");
const multer = require("multer");
const fs = require("fs");
var FormData = require('form-data');
const request = require("request")
const app = express();

function getDestination(req, file, cb) {
  cb(null, '/dev/null')
}
function MyCustomStorage(opts) {
  this.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  this.getDestination(req, file, function (err, path) {
    var form = new FormData();
    for (const key in req.body) {
      form.append(key, req.body[key]);
    }
    form.append("file", file.stream);
    // console.log(form);
    form.submit("http://saas-trainningdata-test.oss-cn-hangzhou.aliyuncs.com", (err, resp) => {
      console.log("err", err);
      console.log("resp", resp.resume().statusCode);
    })
    // console.log(req.body);
    // var wr = fs.createWriteStream(`./img/${file.originalname}`);
    // file.stream.pipe(wr);
  })
}
const storage = new MyCustomStorage({});
const upload = multer({
  storage
})
app.get("/", (req, res) => {
  res.send("hello, world");
});

app.post("/upload", upload.any(), (req, res) => {
  // console.log(req.body);
  res.send("w1");
});
app.listen(3000);
