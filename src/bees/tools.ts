import fs from 'fs-extra';
import path from 'path';
import { BeeTool } from './types.js';

type ToolFactory = () => BeeTool;

const workspaceRoot = path.resolve(process.cwd());

function resolveSafePath(inputPath: string): string {
  const candidate = path.resolve(workspaceRoot, inputPath);
  if (!candidate.startsWith(workspaceRoot)) {
    throw new Error('Path is outside the allowed workspace');
  }
  return candidate;
}

const filesystemToolFactory: ToolFactory = () => ({
  definition: {
    name: 'filesystem',
    description: 'Read, write, and list files in the current workspace.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['read', 'write', 'list'] },
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['action'],
    },
  },
  execute: async (args: { action: string; path?: string; content?: string }) => {
    const action = args?.action;
    const requestedPath = args?.path ?? '.';
    const safePath = resolveSafePath(requestedPath);
    if (action === 'read') {
      const content = await fs.readFile(safePath, 'utf-8');
      return { ok: true, action, path: safePath, content };
    }
    if (action === 'write') {
      if (typeof args?.content !== 'string') {
        throw new Error('content is required for write action');
      }
      await fs.outputFile(safePath, args.content);
      return { ok: true, action, path: safePath };
    }
    if (action === 'list') {
      const entries = await fs.readdir(safePath);
      return { ok: true, action, path: safePath, entries };
    }
    throw new Error(`Unsupported filesystem action: ${String(action)}`);
  },
});

const websearchToolFactory: ToolFactory = () => ({
  definition: {
    name: 'web_search',
    description: 'Search web information or get weather by query.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  execute: async (args: { query: string }) => {
    const query = String(args?.query ?? '').trim();
    if (!query) {
      throw new Error('query is required');
    }
    const encoded = encodeURIComponent(query);
    const url = `https://wttr.in/${encoded}?format=j1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'openbee/1.0' } });
    if (!response.ok) {
      throw new Error(`web_search failed with status ${response.status}`);
    }
    const data = await response.json();
    const current = data?.current_condition?.[0];
    const nearest = data?.nearest_area?.[0]?.areaName?.[0]?.value ?? query;
    return {
      ok: true,
      query,
      location: nearest,
      temperatureC: current?.temp_C ?? null,
      humidity: current?.humidity ?? null,
      weather: current?.weatherDesc?.[0]?.value ?? null,
      raw: data,
    };
  },
});

const skillToToolFactory: Record<string, ToolFactory> = {
  filesystem: filesystemToolFactory,
  websearch: websearchToolFactory,
};

export function resolveToolsForSkills(skills: string[]): BeeTool[] {
  const seen = new Set<string>();
  const resolved: BeeTool[] = [];
  for (const skill of skills) {
    const key = skill.trim().toLowerCase();
    const factory = skillToToolFactory[key];
    if (!factory) {
      continue;
    }
    const tool = factory();
    if (seen.has(tool.definition.name)) {
      continue;
    }
    seen.add(tool.definition.name);
    resolved.push(tool);
  }
  return resolved;
}
