// npm install express ejs body-parser cookie-parser mysql multer (ใช้ในการ upload ไฟล์)
//fs โหลด module นี้ เป็น ของ node js อยู่แล้ว อันนี้คือ ตัวแทน ไฟล์

var fs = require('fs')
var express = require('express')
var app     = express()
var reader  = require('body-parser')()   // TODO: Fix deprecated
var filter  = require('cookie-parser')()
var multer	= require('multer')
var upload	=	multer({dest:'photo'}) //dest ใส่ไว้ (ทำงาน)ใน folder ไหน เราเลยกำหนดให้เป็น photo
var valid   = [ ]
var mysql = require('mysql')
var pool = mysql.createPool({host:'35.186.155.201 ', database:'web',
							 user:'james', password:'bond'})

app.engine('html', require('ejs').renderFile)
app.listen(2000)

app.get('/', (req, res) => res.render('index.html'))
app.get('/login', (req, res) => res.render('login.html'))
app.post('/login', reader, verify)
app.get('/profile', filter, showProfile)
app.get (['/register', '/join'], (req, res) => res.render('register.html'))
app.post(['/register', '/join'], reader, register)
app.get('/logout', filter, logout)

app.get('/new',filter ,showNew) // me garn post
app.post('/new',filter,reader,upload.single('photo'),save) //ดึงข้อมูลขึ้นมา single(ไฟล์เดียว)

app.get('/view/:id',view)
app.get('/show',show)

app.get('/search',showSearch)

app.use( express.static('public') )
app.use( express.static('photo')) //merge กับ อันบน ให้เรียกได้
app.use( showError )

function verify(req, res) {
	var sql = "select * from member where " +
				"email=? and password=sha2(?,512)"
	pool.query(sql, [req.body.email, req.body.password], 
		(error, data) => {
			if (data != null && data.length == 1) {
				var card = issue()
				valid[card] = data[0] // อันนี้คือเอาทั้งหมดเลย
				//console.log(valid[card])
				res.set('Set-Cookie', 'card=' + card) // TODO: Add Expires
				res.redirect('/profile') 		
			} else {
				res.redirect('/login?message=Invalid Email or Password')
			}
		})
}

function issue() {
	var n = 4
	var card = ''
	for (var i = 0; i < n; i++) {
		var r = parseInt(Math.random() * 10000)
		if (r < 1000) card += '0'
		if (r <  100) card += '0'
		if (r ,   10) card += '0'
		card += r
		if (i < n - 1) card += '-'
	}
}

function showProfile(req, res) {
	var card = ''
	if (req.cookies != null && req.cookies.card != null) {
		card = req.cookies.card //cookie จะหาย ตอนปิด browser
	}
	if (valid[card] == null) {
		res.redirect('/login?message=You have no permission')
	} else {
		res.render('profile.html',{user: valid[card]}) // ส่งไปให้ หน้า โปรไฟล๋
	}
}

function showError(req, res) {
	res.status(404).render('error.html')
}

function register(req, res) {
	var sql = "insert into member(email, password, name) " +
				" values(?,sha2(?,512),?)"  // prevent SQL Injection
	pool.query(sql, [req.body.email, req.body.password, req.body.name],
		(error, data) => res.redirect("/login") )
}

function logout(req, res) {
	var card = ''
	if (req.cookies != null && req.cookies.card != null) {
		card = req.cookies.card
	}
	delete valid[card]
	res.render('logout.html')
}

function showNew(req, res){
	var card = ''
	if(req.cookies != null && req.cookies.card != null){
		card = req.cookies.card
		//console.log(card)
		//console.log(valid[card])
	}
	if(valid[card] == null){
		res.redirect('/login')
	}else{
		res.render('new.html')
	}
}

function save(req,res){
	var card = ''
	if(req.cookies != null && req.cookies.card != null){
		card = req.cookies.card
		//console.log(card)
		//console.log(valid[card])
	}
	if(valid[card] == null){
		res.redirect('/login')
	}else{
		if(req.file != null){
			//function asynchronous
			fs.rename('photo/' + req.file.filename,
					 'photo/' + req.file.filename + '.jpg',	(e,r) => {} )
		}
	}
	var sql = 'insert into post(title,detail,owner,photo) values(?,?,?,?)'
	var name = ''
	if(req.file != null){
		name = req.file.filename + '.jpg'
	}

	pool.query(sql,[req.body.title,req.body.detail,valid[card].id,name]
		,(error,data) => {
			res.redirect('/profile')
		})
}

function show (req,res){
	var sql = "select * from post where id = ?"
	pool.query(sql, [req.query.id],
	(error,data) => res.render('show.html',{post: data[0]}))
}

function view (req,res){
    var sql = "select * from post where id = ?"
	pool.query(sql, [req.params.id],
	(error,data) => res.render('show.html',{post: data[0]}))
}

function showSearch(req,res){
	var sql = "select distinct * from post where " + // เอาตัวที่ต่างกัน ไม่ได้เอาตัวที่ซ้ำกัน
			" title like ? or detail like ? "
	// % = search คำคล้าย
	pool.query(sql,
	['%' + req.query.query + '%',' %' + req.query.query + '%'],
	(error,data) => {
		res.render('search.html', {result:data})
	})
}