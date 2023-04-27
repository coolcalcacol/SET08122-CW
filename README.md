## How to rebuild the project:
### Prerequisites:
- Node.js
- npm
- yarn

### Steps:
1. Clone the repository / Download the source code
2. Navigate to the project directory
3. Run `yarn install` to install the dependencies
4. Run `yarn run export` to build, compile to commonJS, and package the project.
5. Run `yarn run start:platform` to run the project.
   - Replace `platform` with the platform you want to run the project on.
   - Valid platforms at this time are: `windows`, `macos` and `linux`
   - Example: `yarn run start:windows`

### Alternative method:
1. Copy steps 1-3 from above
2. Run `yarn run start:bundled` to build and run the project directly.
