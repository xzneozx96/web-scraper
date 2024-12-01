const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const config = require('./config');

const PORT = config.serverPort;

// register routes
const scrapeChototRoutes = require('./routes/scrape-chotot');
const scrapeYoutubeRoutes = require('./routes/scrape-youtube');
const aiAgentRoutes = require('./routes/ai-agent');

// cross origin resource sharing
const allowedDomains = [config.deployedDomain, config.frontendDomain];
const corsOptions = {
	origin: function (origin, callback) {
		// bypass the requests with no origin (like curl requests, mobile apps, etc )
		if (!origin) return callback(null, true);

		if (allowedDomains.indexOf(origin) === -1) {
			const msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
			return callback(new Error(msg), false);
		}
		return callback(null, true);
	},
	credentials: true, //access-control-allow-credentials:true
};
app.use(cors(corsOptions));

// built-in middleware to handle url-encoded data - also called form data so to say
app.use(express.urlencoded({ extended: true }));

// built-in middleware to handle json data submitted via the url
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

// routes registration
app.use('/api', scrapeChototRoutes);
app.use('/api/youtube', scrapeYoutubeRoutes);
app.use('/api/ai-agent', aiAgentRoutes);

// connecting to MongoAtlas via Mongoose
mongoose
	.connect(config.dbURI)
	.then(() => {
		// set up socket server
		const myServer = http.createServer(app);

		myServer.listen(PORT);

		console.log(
			`Database has been connected ! Server listening on port ${PORT}`
		);
		return Promise.resolve('Database connected');
	})
	.catch((err) => {
		console.log('Connecting to DB has failed', err);
		return Promise.reject('Internal Server Error');
	});
