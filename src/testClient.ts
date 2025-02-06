import { spawn } from 'child_process';

// Spawn the MCP server (adjust the path if needed)
const child = spawn('node', ['dist/index.js']);

// Log output from MCP server
child.stdout.on('data', (data) => {
	console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
	console.error('STDERR:', data.toString());
});

// Construct a JSON-RPC–style request.
// Note: The proper format may require a Content-Length header as well.
// Here's a minimal example for the "take_screenshot" method:
const request = JSON.stringify({
	method: 'take_screenshot',
	input: 'https://example.com?desktop',
});

// Write the request to the server's stdin
child.stdin.write(request + '\n');

// Optionally, end the input so the child process exits after handling the request
// child.stdin.end();

const listToolsRequest = JSON.stringify({
	method: 'tools/list',
});
child.stdin.write(listToolsRequest + '\n');
