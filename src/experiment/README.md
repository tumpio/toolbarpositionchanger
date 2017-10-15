Toolbar API
========

A Firefox WebExtension API experiment for browser toolbars.

## API Schema

### Functions

- get(toolbarId) - Get Toolbar by toolbar element ID.
- getAll() - Get all Toolbars in browser Window.
- move(toolbarId, moveProperties) - Move toolbar to the position given in moveProperties. 
- hide(toolbarId) - set toolbar visibility to hidden.
- show(toolbarId) - set toolbar visibility to visible.

### Types

- Toolbar
    - id:string
    - index:integer
    - bottom:boolean
    - hidden:boolean
- moveProperties
    - index:integer
    - bottom:boolean