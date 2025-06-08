#!/usr/bin/env bun
import { Shellish } from '../src/index.ts';
import { existsSync, readFileSync } from 'fs';

// Create a more advanced CLI tool for file operations
const cli = new Shellish({
    name: 'filetools',
    description: 'Advanced file manipulation toolkit',
    version: '2.0.0',
    author: 'Advanced User',
    helpText: `
Examples:
  filetools --copy source.txt dest.txt --backup
  filetools --analyze ./myfile.js --format json
  filetools --batch process *.ts --output results/
`
});


// File copying with backup option
cli.addArgument({
    longName: 'copy',
    shortName: 'c',
    description: 'Copy files from source to destination',
    args: 2,
    callback: async ([source, dest], context) => {
        if (!source || !dest) {
            throw new Error('Both source and destination are required');
        }

        console.log(`Copying ${source} to ${dest}`);

        if (!existsSync(source)) {
            throw new Error(`Source file ${source} does not exist`);
        }

        // Check if backup flag is set
        const shouldBackup = context.parsedArguments.backup;
        if (shouldBackup && existsSync(dest)) {
            console.log(`Creating backup of ${dest}`);
            // Backup logic would go here
        }

        // Copy logic would go here
        console.log(`Successfully copied ${source} to ${dest}`);
    }
});

// Backup flag (works with copy)
cli.addArgument({
    longName: 'backup',
    shortName: 'b',
    description: 'Create backup of destination file if it exists',
    args: 0,
    callback: () => {
        console.log('Backup mode enabled');
    }
});

// File analysis
cli.addArgument({
    longName: 'analyze',
    shortName: 'a',
    description: 'Analyze file and show statistics',
    args: 1,
    callback: async ([filePath], context) => {
        if (!filePath) {
            throw new Error('File path is required');
        }

        if (!existsSync(filePath)) {
            throw new Error(`File ${filePath} does not exist`);
        }

        const content = readFileSync(filePath, 'utf-8');
        const stats = {
            file: filePath,
            size: content.length,
            lines: content.split('\n').length,
            words: content.split(/\s+/).filter(w => w.length > 0).length,
            characters: content.length,
            created: new Date().toISOString()
        };

        const format = context.parsedArguments.format || 'pretty';

        if (format === 'json') {
            console.log(JSON.stringify(stats, null, 2));
        } else {
            console.log(`\nFile Analysis: ${filePath}`);
            console.log(`Lines: ${stats.lines}`);
            console.log(`Words: ${stats.words}`);
            console.log(`Characters: ${stats.characters}`);
            console.log(`Size: ${stats.size} bytes`);
        }
    }
});

// Output format option
cli.addArgument({
    longName: 'format',
    description: 'Output format (pretty, json)',
    args: 1,
    defaultValue: 'pretty',
    callback: ([format]) => {
        if (!format) {
            throw new Error('Format is required');
        }
        if (!['pretty', 'json'].includes(format)) {
            throw new Error('Format must be either "pretty" or "json"');
        }
    }
});

// Batch processing
cli.addArgument({
    longName: 'batch',
    description: 'Process multiple files with a command',
    args: 2, // command and pattern
    callback: async ([command, pattern]) => {
        if (!command || !pattern) {
            throw new Error('Both command and pattern are required');
        }

        console.log(`Batch processing: ${command} on ${pattern}`);

        if (command === 'process') {
            console.log(`Processing files matching pattern: ${pattern}`);
            // Glob matching and processing logic would go here
        } else {
            throw new Error(`Unknown batch command: ${command}`);
        }
    }
});

// Output directory
cli.addArgument({
    longName: 'output',
    shortName: 'o',
    description: 'Output directory for batch operations',
    args: 1,
    callback: ([outputDir]) => {
        console.log(`Output directory: ${outputDir}`);
    }
});

// Dry run mode
cli.addArgument({
    longName: 'dry-run',
    shortName: 'dr',
    description: 'Show what would be done without actually doing it',
    args: 0,
    callback: () => {
        console.log('🔍 DRY RUN MODE - No files will be modified');
    }
});

// Run the CLI
cli.run(); 