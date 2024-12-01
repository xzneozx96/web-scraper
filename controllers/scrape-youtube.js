const { getSubtitleFromVideo } = require('../lib/youtube');

const getScript = async (req, res) => {
	try {
		const { videoId } = req.params;

		const subtitle = await getSubtitleFromVideo(videoId);

		return res.status(201).json({
			success: true,
			data: {
				subtitle,
			},
		});
	} catch (err) {
		console.log(err);
		return res
			.status(500)
			.json({ success: false, message: 'Lỗi Server. Vui lòng thử lại sau' });
	}
};

module.exports = {
	getScript,
};
