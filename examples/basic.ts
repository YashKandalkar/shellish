#!/usr/bin/env bun
import { Shellish } from '../src/index.js';

// Create a simple CLI tool
const cli = new Shellish({
    name: 'exec',
    description: 'Execute nice files',
    version: '1.0.0',
    author: 'Your Name'
});

// Add the file argument as requested
cli.addArgument({
    longName: 'file',
    shortName: 'f',
    description: 'Path to the file to execute',
    args: 1,
    required: true,
    callback: async ([filePath]) => {
        console.log(`Executing file: ${filePath}`);

        // Here you could add actual file execution logic
        try {
            // For demonstration, we'll just log what we would do
            console.log(`Would execute: ${filePath}`);

            // In a real implementation, you might do:
            // const result = await Bun.spawn(['bun', filePath]);
            // console.log(result);
        } catch (error) {
            console.error(`Error executing file: ${error}`);
            process.exit(1);
        }
    }
});

// Add additional arguments for demonstration
cli.addArgument({
    longName: 'verbose',
    description: 'Enable verbose output',
    args: 0,
    callback: () => {
        console.log('Verbose mode enabled');
    }
});

cli.addArgument({
    longName: 'output',
    shortName: 'o',
    description: 'Output file for results',
    args: 1,
    callback: ([outputPath]) => {
        console.log(`Output will be written to: ${outputPath}`);
    }
});

// Run the CLI
cli.run(); 