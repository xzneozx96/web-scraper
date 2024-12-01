const OpenAI = require('openai');
const config = require('../config');
const {
	languageDetector,
	questionOptimizier,
	responseGenerator,
	prepareContext,
} = require('../gpt-prompts');

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: config.openaiAPI,
});

const interactWithGPT = async (req, res) => {
	try {
		const { action } = req.params;

		let prompt_template = '';

		switch (action) {
			case 'detect-language':
				prompt_template = languageDetector;
				break;

			case 'optimize-question':
				prompt_template = questionOptimizier;
				break;

			case 'generate-answer':
				prompt_template = responseGenerator;
				break;

			default:
				break;
		}

		// Destructure the request body
		const { variables = {}, question } = req.body;

		// Validate inputs
		if (!prompt_template || !question) {
			return res.status(400).json({
				error: 'Variables and question are required',
			});
		}

		// Inject variables into the prompt template
		const enhancedPrompt = processInputVariables({
			prompt_template,
			variables,
		});

		const fullPrompt = JSON.stringify(enhancedPrompt);

		// Extract and send back the AI's response
		const aiResponse = await getGptAnswer({
			fullPrompt,
			question,
			max_tokens: 300,
			temperature: 0.7,
		});
		console.log('aiResponse', JSON.stringify(aiResponse));

		return res.status(201).json({
			answer: aiResponse,
		});
	} catch (error) {
		console.error('Error processing request:', error);

		return res.status(500).json({
			error: 'Failed to process request',
			details: error.message,
		});
	}
};

const generateAnswer = async (req, res) => {
	try {
		const prompt_template = responseGenerator;

		// Destructure the request body
		const { variables = {}, question } = req.body;

		console.log('raw chunks', JSON.parse(variables.chunks));
		const gptContext = prepareContext(JSON.parse(variables.chunks));

		const upatedVariables = {
			...variables,
			chunks: gptContext,
		};

		// Validate inputs
		if (!prompt_template || !question) {
			return res.status(400).json({
				error: 'Variables and question are required',
			});
		}

		// Inject variables into the prompt template
		const enhancedPrompt = processInputVariables({
			prompt_template,
			variables: upatedVariables,
		});

		const fullPrompt = JSON.stringify(enhancedPrompt);

		// Extract and send back the AI's response
		const aiResponse = await getGptAnswer({
			fullPrompt,
			question,
			max_tokens: 1000,
			temperature: 0.7,
		});
		console.log('aiResponse', JSON.stringify(aiResponse));

		return res.status(201).json({
			answer: aiResponse,
		});
	} catch (error) {
		console.error('Error processing request:', error);
		return res.status(500).json({
			error: 'Failed to process request',
			details: error.message,
		});
	}
};

const getGptAnswer = async ({
	fullPrompt,
	question,
	max_tokens,
	temperature,
}) => {
	// Make API call to OpenAI
	const response = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: fullPrompt },
			{ role: 'user', content: question },
		],
		max_tokens: max_tokens,
		temperature: temperature,
	});

	// Extract and send back the AI's response
	return response.choices[0].message.content;
};

const processInputVariables = ({ variables, prompt_template }) => {
	return Object.entries(variables).reduce((template, [key, value]) => {
		// Replace placeholders like {variable_name} with actual values
		return template.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
	}, prompt_template);
};

module.exports = {
	interactWithGPT,
	generateAnswer,
};
