const express = require("express");
const multer = require("multer");
const fs = require("fs");
const app = express();

function getDestination(req, file, cb) {
  cb(null, '/dev/null')
}
function MyCustomStorage(opts) {
  this.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  console.log(req.body);
  this.getDestination(req, file, function (err, path) {
    var wr = fs.createWriteStream(`./img/${file.originalname}`);
    file.stream.pipe(wr);
    // cb(null, 123);
    // console.log("asd");
    // if (err) return cb(err)
    // // console.log(file.stream);
    // fdfs.upload(file.stream, {
    //   size: 123
    // }).then(function (fileId) {
    //   // fileId 为 group + '/' + filename
    //   cb(null, {
    //     id: fileId~
    //   })
    //   // console.log(fileId);
    // }).catch(function (err) {
    //   console.error(err);
    // });

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
