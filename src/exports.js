/*
Copyright 2019 Adobe. All rights reserved.
you may not use this file except in compliance with the License. You may obtain a copy
This file is licensed to you under the Apache License, Version 2.0 (the "License");
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const DirectBinaryUpload = require('./direct-binary-upload');
const DirectBinaryUploadOptions = require('./direct-binary-upload-options');
const DirectBinaryUploadErrorCodes = require('./error-codes');
const FileSystemUpload = require('./filesystem-upload');
const FileSystemUploadOptions = require('./filesystem-upload-options');
const HttpProxy = require('./http-proxy');

module.exports = {
  DirectBinaryUpload,
  DirectBinaryUploadOptions,
  DirectBinaryUploadErrorCodes,
  FileSystemUpload,
  FileSystemUploadOptions,
  HttpProxy,
};
