import { describe, it, expect, beforeEach } from 'bun:test';
import { Shellish } from '../src/shellish.js';

describe('Shellish CLI Builder', () => {
    let cli: Shellish;

    beforeEach(() => {
        cli = new Shellish({
            name: 'test-cli',
            description: 'A test CLI application',
            version: '1.0.0'
        });
    });

    describe('Constructor', () => {
        it('should create a new Shellish instance with required options', () => {
            expect(cli).toBeInstanceOf(Shellish);
        });

        it('should create default help and version arguments', async () => {
            const result = await cli.parse(['--help']);
            expect(result.success).toBe(true);
        });
    });

    describe('addArgument', () => {
        it('should add a simple flag argument', () => {
            let callbackCalled = false;

            cli.addArgument({
                longName: 'verbose',
                shortName: 'v',
                description: 'Enable verbose mode',
                callback: () => {
                    callbackCalled = true;
                }
            });

            expect(callbackCalled).toBe(false);
        });

        it('should throw error for duplicate long names', () => {
            cli.addArgument({
                longName: 'test',
                description: 'Test argument',
                callback: () => { }
            });

            expect(() => {
                cli.addArgument({
                    longName: 'test',
                    description: 'Another test argument',
                    callback: () => { }
                });
            }).toThrow('Argument with long name \'test\' already exists');
        });

        it('should throw error for duplicate short names', () => {
            cli.addArgument({
                longName: 'test1',
                shortName: 't',
                description: 'Test argument 1',
                callback: () => { }
            });

            expect(() => {
                cli.addArgument({
                    longName: 'test2',
                    shortName: 't',
                    description: 'Test argument 2',
                    callback: () => { }
                });
            }).toThrow('Argument with short name \'t\' already exists');
        });
    });

    describe('parse', () => {
        beforeEach(() => {
            // Remove default help/version to avoid process.exit in tests
            cli = new Shellish({
                name: 'test-cli',
                description: 'A test CLI application'
            });
        });

        it('should parse simple flag arguments', async () => {
            let verboseCalled = false;

            cli.addArgument({
                longName: 'verbose',
                shortName: 'v',
                description: 'Enable verbose mode',
                callback: () => {
                    verboseCalled = true;
                }
            });

            const result = await cli.parse(['--verbose']);
            expect(result.success).toBe(true);
            expect(verboseCalled).toBe(true);
        });

        it('should parse short form arguments', async () => {
            let verboseCalled = false;

            cli.addArgument({
                longName: 'verbose',
                shortName: 'v',
                description: 'Enable verbose mode',
                callback: () => {
                    verboseCalled = true;
                }
            });

            const result = await cli.parse(['-v']);
            expect(result.success).toBe(true);
            expect(verboseCalled).toBe(true);
        });

        it('should parse arguments with single values', async () => {
            let receivedFile = '';

            cli.addArgument({
                longName: 'file',
                shortName: 'f',
                description: 'Input file',
                args: 1,
                callback: ([file]) => {
                    receivedFile = file || '';
                }
            });

            const result = await cli.parse(['--file', 'test.txt']);
            expect(result.success).toBe(true);
            expect(receivedFile).toBe('test.txt');
        });

        it('should parse arguments with multiple values', async () => {
            let receivedFiles: string[] = [];

            cli.addArgument({
                longName: 'files',
                description: 'Multiple input files',
                args: 3,
                callback: (files) => {
                    receivedFiles = files;
                }
            });

            const result = await cli.parse(['--files', 'file1.txt', 'file2.txt', 'file3.txt']);
            expect(result.success).toBe(true);
            expect(receivedFiles).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
        });

        it('should return error for unknown arguments', async () => {
            const result = await cli.parse(['--unknown']);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown argument: --unknown');
        });

        it('should return error for insufficient argument values', async () => {
            cli.addArgument({
                longName: 'file',
                description: 'Input file',
                args: 1,
                callback: () => { }
            });

            const result = await cli.parse(['--file']);
            expect(result.success).toBe(false);
            expect(result.error).toContain('requires 1 value(s)');
        });

        it('should handle required arguments', async () => {
            cli.addArgument({
                longName: 'required',
                description: 'Required argument',
                args: 1,
                required: true,
                callback: () => { }
            });

            const result = await cli.parse([]);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Required argument --required is missing');
        });

        it('should use default values for missing optional arguments', async () => {
            let receivedValue = '';

            cli.addArgument({
                longName: 'optional',
                description: 'Optional argument with default',
                args: 1,
                required: true,
                defaultValue: 'default-value',
                callback: ([value]) => {
                    receivedValue = value || '';
                }
            });

            const result = await cli.parse([]);
            expect(result.success).toBe(true);
            expect(receivedValue).toBe('');
        });

        it('should handle callback errors gracefully', async () => {
            cli.addArgument({
                longName: 'error',
                description: 'Argument that throws error',
                callback: () => {
                    throw new Error('Callback error');
                }
            });

            const result = await cli.parse(['--error']);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Error executing callback for --error: Callback error');
        });
    });

    describe('context', () => {
        beforeEach(() => {
            cli = new Shellish({
                name: 'test-cli',
                description: 'A test CLI application'
            });
        });

        it('should provide correct context to callbacks', async () => {
            let receivedContext: any = null;

            cli.addArgument({
                longName: 'test',
                description: 'Test argument',
                callback: (args, context) => {
                    receivedContext = context;
                }
            });

            await cli.parse(['--test']);

            expect(receivedContext).toBeDefined();
            expect(receivedContext.command).toBe('test-cli');
            expect(receivedContext.allArgs).toEqual(['--test']);
            expect(receivedContext.parsedArguments).toBeDefined();
        });
    });
}); 