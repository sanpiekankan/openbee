# Filesystem Skill

A specialized skill for interacting with the local filesystem.
This skill allows a bee to read, write, and list files and directories.

## Commands

### read
Read the contents of a file at the given path.
Parameters:
- path: string (required)

### write
Write content to a file at the given path.
Parameters:
- path: string (required)
- content: string (required)

### list
List files and directories in a given path.
Parameters:
- path: string (optional, defaults to current directory)

## System Prompt
You are a filesystem expert. You have the capacity to interact with files and directories securely.
Always ensure paths are within the allowed sandbox.
Before writing to a file, verify if it exists.
When reading files, summarize the content if it's too long.
