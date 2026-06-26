/**
 * Service template (standard decorator mode).
 *
 * Uses field injection (@Inject on fields) instead of constructor params.
 * ORM-agnostic: uses common repository methods (findAll, findById, create, updateById, deleteById)
 * that exist on both DrizzleRepository and KyselyRepository.
 *
 * Context:
 *   name          — PascalCase class name
 *   camel         — camelCase variable
 *   repository    — PascalCase repository name (only if ORM !== 'none')
 *   repositoryCamel — camelCase repo variable
 */

export default `
import { Injectable, Inject } from '@nexusts/core';
{{#hasRepo}}import { {{ repository }} } from '../repositories/{{ kebab }}.repository.js';{{/hasRepo}}

@Injectable()
export class {{ name }}Service {
  {{#hasRepo}}@Inject({{ repository }}) declare {{ repositoryCamel }}: {{ repository }};{{/hasRepo}}

  async findAll() {
    {{#hasRepo}}return this.{{ repositoryCamel }}.findAll();{{/hasRepo}}
    {{^hasRepo}}return []; // TODO: implement{{/hasRepo}}
  }

  async findOne(id: number) {
    {{#hasRepo}}return this.{{ repositoryCamel }}.findById(id);{{/hasRepo}}
    {{^hasRepo}}return { id }; // TODO: implement{{/hasRepo}}
  }

  async create(data: any) {
    {{#hasRepo}}return this.{{ repositoryCamel }}.create(data);{{/hasRepo}}
    {{^hasRepo}}return { id: Date.now(), ...data }; // TODO: implement{{/hasRepo}}
  }

  async update(id: number, data: any) {
    {{#hasRepo}}return this.{{ repositoryCamel }}.updateById(id, data);{{/hasRepo}}
    {{^hasRepo}}return { id, ...data }; // TODO: implement{{/hasRepo}}
  }

  async delete(id: number) {
    {{#hasRepo}}return this.{{ repositoryCamel }}.deleteById(id);{{/hasRepo}}
    {{^hasRepo}}return { removed: id }; // TODO: implement{{/hasRepo}}
  }
}
`.trimStart();
