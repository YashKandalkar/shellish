import type { ShellishOptions, ArgumentOptions, ParsedArgument, ParsedContext, ParseResult } from './types.ts';

export class Shellish {
    private options: ShellishOptions;
    // Map of long name to argument definition
    private arguments: Map<string, ParsedArgument> = new Map();
    // Map of short name to long name
    private shortNameMap: Map<string, string> = new Map();

    /**
     * Create a new Shellish instance.
     * @param options - The options for the command.
     */
    constructor(options: ShellishOptions) {
        this.options = options;

        // Add default help argument
        this.addArgument({
            longName: 'help',
            shortName: 'h',
            description: 'Show help information',
            args: 0,
            callback: () => {
                this.showHelp();
                process.exit(0);
            }
        });

        // Add default version argument if version is provided
        if (options.version) {
            this.addArgument({
                longName: 'version',
                shortName: 'v',
                description: 'Show version information',
                args: 0,
                callback: () => {
                    console.log(`${this.options.name} v${this.options.version}`);
                    process.exit(0);
                }
            });
        }
    }

    /**
     * Add an argument to the command.
     * @param argOptions - The options for the argument.
     * @returns The command instance.
     */
    addArgument(argOptions: ArgumentOptions): this {
        const parsedArg: ParsedArgument = {
            longName: argOptions.longName,
            shortName: argOptions.shortName,
            description: argOptions.description,
            args: argOptions.args ?? 0,
            required: argOptions.required ?? false,
            defaultValue: argOptions.defaultValue,
            callback: argOptions.callback
        };

        // Check for duplicate long names
        if (this.arguments.has(argOptions.longName)) {
            throw new Error(`Argument with long name '${argOptions.longName}' already exists`);
        }

        // Check for duplicate short names
        if (argOptions.shortName) {
            if (this.shortNameMap.has(argOptions.shortName)) {
                throw new Error(`Argument with short name '${argOptions.shortName}' already exists`);
            }
            this.shortNameMap.set(argOptions.shortName, argOptions.longName);
        }

        this.arguments.set(argOptions.longName, parsedArg);
        return this;
    }

    /**
     * Parse the arguments and return the result.
     * @param args - The arguments to parse.
     * @returns The result of the parse.
     */
    async parse(args: string[] = process.argv.slice(2)): Promise<ParseResult> {
        try {
            const parsedArguments: Record<string, any> = {};
            const context: ParsedContext = {
                command: this.options.name,
                remainingArgs: [...args],
                allArgs: [...args],
                parsedArguments
            };

            let i = 0;
            while (i < args.length) {
                const arg = args[i];

                if (!arg) {
                    i++;
                    continue;
                }

                if (arg.startsWith('--')) {
                    // Long form argument
                    const longName = arg.substring(2);
                    const argumentDef = this.arguments.get(longName);

                    if (!argumentDef) {
                        return {
                            success: false,
                            error: `Unknown argument: ${arg}`
                        };
                    }

                    const result = await this.processArgument(argumentDef, args, i, context);
                    if (!result.success) {
                        return result;
                    }
                    i = result.nextIndex;

                } else if (arg.startsWith('-') && arg.length > 1) {
                    // Short form argument
                    const shortName = arg.substring(1);
                    const longName = this.shortNameMap.get(shortName);

                    if (!longName) {
                        return {
                            success: false,
                            error: `Unknown argument: ${arg}`
                        };
                    }

                    const argumentDef = this.arguments.get(longName);
                    if (!argumentDef) {
                        return {
                            success: false,
                            error: `Internal error: argument definition not found for ${longName}`
                        };
                    }

                    const result = await this.processArgument(argumentDef, args, i, context);
                    if (!result.success) {
                        return result;
                    }
                    i = result.nextIndex;

                } else {
                    // Non-flag argument, skip for now
                    i++;
                }
            }

            // Check for required arguments
            for (const [longName, argDef] of this.arguments) {
                if (argDef.required && !(longName in parsedArguments)) {
                    if (argDef.defaultValue !== undefined) {
                        parsedArguments[longName] = argDef.defaultValue;
                    } else {
                        return {
                            success: false,
                            error: `Required argument --${longName} is missing`
                        };
                    }
                }
            }

            return { success: true };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Process an argument and collect its values depending on number of args in argumentDef.
     * @param argumentDef - The definition of the argument to process.
     * @param args - The list of arguments to process.
     * @param currentIndex - The index of the current argument.
     * @param context - The context of the current argument.
     * @returns An object containing the success status, the next index, and an error message if the argument processing fails.
     */
    private async processArgument(
        argumentDef: ParsedArgument,
        args: string[],
        currentIndex: number,
        context: ParsedContext
    ): Promise<{ success: boolean; nextIndex: number; error?: string }> {
        const argValues: string[] = [];
        let nextIndex = currentIndex + 1;

        // Collect the required number of arguments
        if (argumentDef.args === -1) {
            // Unlimited arguments - collect all until next valid top level argument or end
            let j = 0;
            while (nextIndex + j < args.length) {
                const nextArg = args[nextIndex + j];
                if (!nextArg || nextArg.startsWith('-')) {
                    break;
                }
                argValues.push(nextArg);
                j++;
            }
            nextIndex += j;
        } else {
            // Fixed number of arguments
            for (let j = 0; j < argumentDef.args; j++) {
                if (nextIndex + j >= args.length) {
                    return {
                        success: false,
                        nextIndex: nextIndex + j,
                        error: `Argument --${argumentDef.longName} requires ${argumentDef.args} value(s), but only ${j} provided`
                    };
                }

                const nextArg = args[nextIndex + j];
                if (!nextArg || nextArg.startsWith('-')) {
                    return {
                        success: false,
                        nextIndex: nextIndex + j,
                        error: `Argument --${argumentDef.longName} requires ${argumentDef.args} value(s), but found ${!nextArg ? 'end of arguments' : `flag ${nextArg}`}`
                    };
                }

                argValues.push(nextArg);
            }
            nextIndex += argumentDef.args;
        }
        context.parsedArguments[argumentDef.longName] = argumentDef.args === 0 ? true : (argumentDef.args === 1 ? argValues[0] : argValues);

        // Execute callback
        try {
            await argumentDef.callback(argValues, context);
        } catch (error) {
            return {
                success: false,
                nextIndex,
                error: `Error executing callback for --${argumentDef.longName}: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }

        return { success: true, nextIndex };
    }

    /**
     * Show help information for the command.
     */
    showHelp(): void {
        console.log(`${this.options.name} - ${this.options.description}`);
        if (this.options.version) {
            console.log(`Version: ${this.options.version}`);
        }
        if (this.options.author) {
            console.log(`Author: ${this.options.author}`);
        }
        console.log('\nUsage:');
        console.log(`  ${this.options.name} [options]`);
        console.log('\nOptions:');

        const argEntries = Array.from(this.arguments.entries());
        const maxLongNameLength = Math.max(...argEntries.map(([longName]) => longName.length));

        for (const [longName, argDef] of argEntries) {
            const shortFlag = argDef.shortName ? `-${argDef.shortName}, ` : '    ';
            const longFlag = `--${longName}`.padEnd(maxLongNameLength + 2);
            const argsIndicator = argDef.args > 0 ? ` <${argDef.args === 1 ? 'value' : `${argDef.args} values`}>` : '';
            const required = argDef.required ? ' (required)' : '';

            console.log(`  ${shortFlag}${longFlag}${argsIndicator.padEnd(15)} ${argDef.description}${required}`);
        }

        if (this.options.helpText) {
            console.log(`\n${this.options.helpText}`);
        }
    }

    /**
     * Run the command.
     * @param args - The arguments to parse.
     */
    async run(args?: string[]): Promise<void> {
        const result = await this.parse(args);

        if (!result.success) {
            console.error(`Error: ${result.error}`);
            console.log('\nUse --help for usage information.');
            process.exit(1);
        }

        process.exit(0);
    }
} 