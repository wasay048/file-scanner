const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const handleForm = require('./fileUpload');
const NodeClam = require('clamscan');
const app = express();

const ClamScan = new NodeClam().init({
    remove_infected: false, // If true, removes infected files
    quarantine_infected: false, // False: Don't quarantine, Path: Moves files to this place.
    scan_log: null, // Path to a writeable log file to write scan results into
    debug_mode: false, // Whether or not to log info/debug/error msgs to the console
    file_list: null, // path to file containing list of files to scan (for scan_files method)
    scan_recursively: true, // If true, deep scan folders recursively
    clamscan: {
        path: '/usr/bin/clamscan', // Path to clamscan binary on your server
        db: null, // Path to a custom virus definition database
        scan_archives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
        active: true // If true, this module will consider using the clamscan binary
    },
    clamdscan: {
        socket: false, // Socket file for connecting via TCP
        host: false, // IP of host to connect to TCP interface
        port: false, // Port of host to use when connecting via TCP interface
        timeout: 60000, // Timeout for scanning files
        local_fallback: false, // Do no fail over to binary-method of scanning
        path: '/usr/bin/clamdscan', // Path to the clamdscan binary on your server
        config_file: null, // Specify config file if it's in an unusual place
        multiscan: true, // Scan using all available cores! Yay!
        reload_db: false, // If true, will re-load the DB on every call (slow)
        active: true, // If true, this module will consider using the clamdscan binary
        bypass_test: false, // Check to see if socket is available when applicable
    },
    preference: 'clamdscan' // If clamdscan is found and active, it will be used by default
})

app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

function scanFile(filePath) {
    return ClamScan.then(async clamscan => {
        const { is_infected, viruses } = await clamscan.scan_file(filePath);
        if (is_infected) {
            console.log(`The file is INFECTED with ${viruses}`);
            throw new Error('ERR_FILE_SCAN_INFECTED');
        } else {
            console.log("clean");
            return 'CLEAN';
        }
    }).catch(err => {
        throw new Error(err);
    });
}
app.post('/test', handleForm, async (req, res) => {
    try {
        console.log(req.files);
        const avStatus = await scanFile(req.files.someDocument.path); // Pass the full path of the file
        // All OK!
    } catch (err) {
        console.log('Raise alarm!', err);
    }
})

app.listen(8081, () => {
    console.log("App is working");
})