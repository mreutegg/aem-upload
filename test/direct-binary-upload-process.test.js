/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/* eslint-env mocha */

const should = require('should');
const { Readable } = require('stream');

const { getTestOptions } = require('./testutils');
const MockRequest = require('./mock-request');
const MockBlob = require('./mock-blob');
const UploadResult = require('../src/upload-result');
const DirectBinaryUploadProcess = require('../src/direct-binary-upload-process');
const DirectBinaryUploadOptions = require('../src/direct-binary-upload-options');

describe('DirectBinaryUploadProcessTest', () => {
  beforeEach(() => {
    MockRequest.reset();
  });

  describe('upload', () => {
    async function runCompleteTest(createVersion, versionLabel, versionComment, replace) {
      const targetFolder = `/target/folder-create-version-${new Date().getTime()}`;
      MockRequest.addDirectUpload(targetFolder);
      const fileData = {
        fileName: 'myasset.jpg',
        fileSize: 512,
        blob: new MockBlob(),
      };

      if (createVersion) {
        fileData.createVersion = true;
        if (versionLabel) {
          fileData.versionLabel = versionLabel;
        }
        if (versionComment) {
          fileData.versionComment = versionComment;
        }
      }

      if (replace) {
        fileData.replace = true;
      }

      const options = new DirectBinaryUploadOptions()
        .withUrl(MockRequest.getUrl(targetFolder))
        .withUploadFiles([fileData]);

      const process = new DirectBinaryUploadProcess(getTestOptions(), options);

      await process.upload(new UploadResult(getTestOptions(), options));

      // verify that complete request is correct
      const directUploads = MockRequest.getDirectUploads();
      should(directUploads.length).be.exactly(1);
      should(directUploads[0].uploadFiles.length).be.exactly(1);

      const uploadFile = directUploads[0].uploadFiles[0];
      should(uploadFile.fileUrl).be.exactly(`${MockRequest.getUrl(targetFolder)}/myasset.jpg`);
      should(uploadFile.fileSize).be.exactly(512);

      if (createVersion) {
        should(uploadFile.createVersion).be.ok();
        if (versionLabel) {
          should(uploadFile.versionLabel).be.exactly(versionLabel);
        } else {
          should(uploadFile.versionLabel).not.be.ok();
        }
        if (versionComment) {
          should(uploadFile.versionComment).be.exactly(versionComment);
        } else {
          should(versionComment).not.be.ok();
        }
      } else {
        should(uploadFile.createVersion).not.be.ok();
        should(uploadFile.versionLabel).not.be.ok();
        should(uploadFile.versionComment).not.be.ok();
      }
      if (replace) {
        should(uploadFile.replace).be.ok();
      } else {
        should(uploadFile.replace).not.be.ok();
      }
    }

    it('create version test', async () => {
      await runCompleteTest(true);
    });

    it('create version with label and comments', async () => {
      await runCompleteTest(true, 'label', 'comment');
    });

    it('replace test', async () => {
      await runCompleteTest(false, 'label', 'comment', true);
    });

    it('replace and create version test', async () => {
      await runCompleteTest(true, 'label', 'comment', true);
    });

    it('trailing slash', async () => {
      const targetFolder = '/target/folder-trailing-slash';
      MockRequest.addDirectUpload(targetFolder);

      const options = new DirectBinaryUploadOptions()
        .withUrl(MockRequest.getUrl(`${targetFolder}/`))
        .withUploadFiles([{
          fileName: 'myasset.jpg',
          fileSize: 512,
          blob: new MockBlob(),
        }]);
      const process = new DirectBinaryUploadProcess(getTestOptions(), options);
      await process.upload(new UploadResult(getTestOptions(), options));

      const directUploads = MockRequest.getDirectUploads();
      should(directUploads.length).be.exactly(1);
      should(directUploads[0].uploadFiles.length).be.exactly(1);

      const uploadFile = directUploads[0].uploadFiles[0];
      should(uploadFile.fileUrl).be.exactly(`${MockRequest.getUrl(targetFolder)}/myasset.jpg`);
    });

    it('file upload smoke', async () => {
      const fileSize = 1024;
      const targetFolder = '/target/file-upload-smoke';
      MockRequest.addDirectUpload(targetFolder);
      const options = new DirectBinaryUploadOptions()
        .withUrl(MockRequest.getUrl(targetFolder))
        .withUploadFiles([{
          fileName: 'fileuploadsmoke.jpg',
          fileSize,
          blob: {
            slice: () => {
              const s = new Readable();
              // eslint-disable-next-line no-underscore-dangle
              s._read = () => {};
              let value = '';
              for (let i = 0; i < fileSize / 2; i += 1) {
                value += 'a';
              }
              s.push(value);
              s.push(value);
              s.push(null);

              return s;
            },
          },
        }]);
      const process = new DirectBinaryUploadProcess({
        ...getTestOptions(),
        progressDelay: 0,
      }, options);

      await process.upload(new UploadResult(getTestOptions(), options));
      const directUploads = MockRequest.getDirectUploads();
      should(directUploads.length).be.exactly(1);
      should(directUploads[0].uploadFiles.length).be.exactly(1);

      const uploadFile = directUploads[0].uploadFiles[0];
      should(uploadFile.fileUrl).be.exactly('http://localhost/content/dam/target/file-upload-smoke/fileuploadsmoke.jpg');
      should(uploadFile.fileSize).be.exactly(1024);
    });

    it('test total upload size', () => {
      const options = new DirectBinaryUploadOptions()
        .withUploadFiles([{
          fileName: 'fileuploadsmoke.jpg',
          fileSize: 1024,
          filePath: '/test/file/path.jpg',
        }, {
          fileName: 'fileuploadsmoke2.jpg',
          fileSize: 2048,
          filePath: '/test/file/path2.jpg',
        }]);
      const process = new DirectBinaryUploadProcess(getTestOptions(), options);
      should(process.getTotalSize()).be.exactly(3072);
    });
  });
});
