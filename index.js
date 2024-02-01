try {
	const express = require("express");
	const bodyParser = require('body-parser')
	const app = express();
	const fs = require('fs');
	const path = require('path');

	function join(url) {
		return path.join(__dirname, url);
	}

	function isInProject(url) {
		return path.normalize(join(url)).startsWith(__dirname);
	}

	app.use(express.static(__dirname));

	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: false }));
	// parse application/json
	app.use(bodyParser.json());

	// 全局 中间件  解决所有路由的 跨域问题
	app.all('*', function (req, res, next) {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type')
		res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
		next()
	});

	app.get("/", (req, res) => {
		res.send(fs.readFileSync(join('index.html')));
	});

	app.get("/createDir", (req, res) => {
		const { dir } = req.query;
		if (!isInProject(dir)) {
			throw new Error(`只能访问${ __dirname }的文件或文件夹`);
		}
		if (!fs.existsSync(join(dir))) fs.mkdirSync(join(dir), { recursive: true });
		res.json(successfulJson(true));
	});

	app.get("/readFile", (req, res) => {
		const { fileName } = req.query;
		if (!isInProject(fileName)) {
			throw new Error(`只能访问${__dirname}的文件或文件夹`);
		}
		if (fs.existsSync(join(fileName))) {
			res.json(successfulJson(
				Array.prototype.slice.call(
					new Uint8Array(
						fs.readFileSync(join(fileName))
					)
				)
			));
		} else {
			res.json(failedJson(404, '文件不存在'));
		}
	});

	app.get("/readFileAsText", (req, res) => {
		const { fileName } = req.query;
		if (!isInProject(fileName)) {
			throw new Error(`只能访问${__dirname}的文件或文件夹`);
		}
		if (fs.existsSync(join(fileName))) {
			res.json(successfulJson(fs.readFileSync(join(fileName), 'utf-8')));
		} else {
			res.json(failedJson(404, '文件不存在'));
		}
	});

	app.post("/writeFile", (req, res) => {
		const { path: p, data } = req.body;
		if (!isInProject(p)) {
			throw new Error(`只能访问${__dirname}的文件或文件夹`);
		}
		fs.mkdirSync(path.dirname(join(p)), { recursive: true });
		fs.writeFileSync(join(p), Buffer.from(data));
		res.json(successfulJson(true));
	});

	app.get("/removeFile", (req, res) => {
		const { fileName } = req.query;
		if (!isInProject(fileName)) {
			throw new Error(`只能访问${__dirname}的文件或文件夹`);
		}
		if (!fs.existsSync(join(fileName))) {
			throw new Error(`文件不存在`);
		}
		const stat = fs.lstatSync(join(fileName));
		if (stat.isDirectory()) {
			throw new Error("不能删除文件夹");
		}
		fs.unlinkSync(join(fileName));
		res.json(successfulJson(true));
	});

	app.get("/getFileList", (req, res) => {
		const { dir } = req.query;
		if (!isInProject(dir)) {
			throw new Error(`只能访问${__dirname}的文件或文件夹`);
		}
		if (!fs.existsSync(join(dir))) {
			throw new Error(`文件夹不存在`);
		}
		const stat = fs.lstatSync(join(dir));
		if (stat.isFile()) {
			throw new Error("getFileList只适用于文件夹而不是文件");
		}
		const files = [], folders = [];
		try {
			fs.readdir(join(dir), (err, filelist) => {
				if (err) {
					res.json(failedJson(500, String(err)));
					return;
				}
				for (let i = 0; i < filelist.length; i++) {
					if (filelist[i][0] != '.' && filelist[i][0] != '_') {
						if (fs.statSync(join(dir) + '/' + filelist[i]).isDirectory()) {
							folders.push(filelist[i]);
						}
						else {
							files.push(filelist[i]);
						}
					}
				}
				res.json(successfulJson({ folders, files }));
			});
		}
		catch (e) {
			res.json(failedJson(500, String(e)));
		}
	});

	app.use((req, res, next) => {
		res.status(404).send("Sorry can't find that!");
	})

	app.use(function (err, req, res, next) {
		console.log(err);
		return res.json(failedJson(400, String(err)));
	});

	app.listen(8089, () => {
		console.log("应用正在监听 8089 端口 !");
		if (!process.argv[2]) require('child_process').exec('start http://localhost:8089/');
	});

	class ReturnData {
		success;

		code;

		errorMsg;

		data;

		constructor() {}

		getSuccess() {
			return this.success;
		}

		setSuccess(success) {
			this.success = success;
		}

		getCode() {
			return this.code;
		}

		setCode(errorCode) {
			this.code = errorCode;
		}

		getErrorMsg() {
			return this.errorMsg;
		}

		setErrorMsg(errorMsg) {
			this.errorMsg = errorMsg;
		}

		getData() {
			this.data;
		}

		setData(data) {
			this.data = data;
		}
	}

	/**
     * Business is successful.
     *
     * @param data return data.
     *
     * @return json.
     */
    function successfulJson(data) {
        const returnData = new ReturnData();
		returnData.setSuccess(true);
		returnData.setCode(200);
		returnData.setData(data);
		return returnData;
	}

    /**
     * Business is failed.
     *
     * @param code error code.
     * @param message message.
     *
     * @return json.
     */
	function failedJson(code, message) {
		const returnData = new ReturnData();
		returnData.setSuccess(false);
		returnData.setCode(code);
		returnData.setErrorMsg(message);
		return returnData;
	}

} catch (e) {
	console.error(e);
}