const cors = require('cors');
const express = require('express');
const app = express();
const execFile = require('child_process').execFile;

const port = 3000;
const host = `http://localhost:${port}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/', (req, res) => {
    res.send(host + '/index.html');
});

app.post('/history', (req, res) => {
    let path = req.body.path;

    execFile('git', ['-C', path, 'log', '--pretty=format:%H%x09%an <%ae>%x09%ad%x09%s'], (error, stdout, stderr) => {
        let lines = stdout.split("\n");

        let length = lines.length;

        let messages = [];

        for(let i = 0; i < length; i++) {
            let line = lines[i];

            let json = line.replace(/"/g, '\\"').replace(/\t/g, "    ").replace(/(.*) {4}(.*) {4}(.*) {4}(.*)/, '{ "hash": "$1", "author": "$2", "date": "$3", "message": "$4" }');

            try {
                messages.push(JSON.parse(json));
            } catch(err) {
                console.error(line);

                console.error(json);
            }
        }

        res.json(messages);
    });
});

app.post('/tree', (req, res) => {
    let path = req.body.path;
    let commit = req.body.commit;

    execFile('git', ['-C', path, 'ls-tree', '-r', '-l', commit], (error, stdout, stderr) => {
        let lines = stdout.split("\n");

        lines.pop(); // last line is empty, so remove last element...

        let length = lines.length;

        let files = [];

        for(let i = 0; i < length; i++) {
            let line = lines[i];

            let json = line.replace(/([0-7]{6}) (.*) ([a-z0-9]{40}) *([0-9]{1,})\t(.*)/, '{ "mode": "$1", "type": "$2", "hash": "$3", "size": "$4", "file": "$5" }');

            try {
                files.push(JSON.parse(json));
            } catch(err) {
                console.error(line);

                console.error(json);
            }
        }

        res.json(files);
    });
});

app.post('/file', (req, res) => {
    let path = req.body.path;
    let commit = req.body.commit;
    
    execFile('git', ['-C', path, 'show', commit], (error, stdout, stderr) => {
        let content = stdout;

        res.send(content);
    });
});

app.listen(port, () => {
    console.log(`App listening at ${host}`);
});
