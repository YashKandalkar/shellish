export interface ShellishOptions {
    name: string;
    description: string;
    version?: string;
    author?: string;
    helpText?: string;
}

export interface ArgumentOptions {
    /** The long name of the argument */
    longName: string;
    /** The short name of the argument */
    shortName?: string;
    /** The description of the argument */
    description: string;
    /** 
     * The number of arguments the argument takes.
     * -1 for unlimited arguments, till next valid top level argument.
     */
    args?: number;
    /** Whether the argument is required */
    required?: boolean;
    /** The default value of the argument */
    defaultValue?: any;
    /** The callback to execute when the argument is parsed */
    callback: (args: string[], context: ParsedContext) => void | Promise<void>;
}

export interface ParsedArgument {
    longName: string;
    shortName?: string;
    description: string;
    args: number;
    required: boolean;
    defaultValue?: any;
    callback: (args: string[], context: ParsedContext) => void | Promise<void>;
}

export interface ParsedContext {
    command: string;
    remainingArgs: string[];
    allArgs: string[];
    parsedArguments: Record<string, any>;
}

export interface ParseResult {
    success: boolean;
    error?: string;
    helpRequested?: boolean;
}