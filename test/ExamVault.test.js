const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ExamVault Smart Contract", function () {
  let examVault;
  let examiner, center1, center2, unauthorizedAccount;
  const examId = 101;
  const sampleCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sampleAESKey = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  beforeEach(async function () {
    [examiner, center1, center2, unauthorizedAccount] = await ethers.getSigners();
    const ExamVault = await ethers.getContractFactory("ExamVault");
    examVault = await ExamVault.deploy();
    await examVault.waitForDeployment();
  });

  describe("Exam Creation", function () {
    it("should allow examiner to create an exam with authorized centers", async function () {
      const currentTime = await time.latest();
      const unlockTime = currentTime + 3600; // 1 hour in the future

      await expect(
        examVault
          .connect(examiner)
          .createExam(examId, sampleCID, unlockTime, sampleAESKey, [
            center1.address,
            center2.address,
          ])
      )
        .to.emit(examVault, "ExamCreated")
        .withArgs(examId, sampleCID, unlockTime, examiner.address, 2);

      const metadata = await examVault.getExamMetadata(examId, center1.address);
      expect(metadata.ipfsCID).to.equal(sampleCID);
      expect(metadata.unlockTime).to.equal(unlockTime);
      expect(metadata.examiner).to.equal(examiner.address);
      expect(metadata.isCallerAuthorized).to.be.true;
      expect(metadata.isUnlocked).to.be.false;
    });

    it("should revert if creating with duplicate examId", async function () {
      const currentTime = await time.latest();
      const unlockTime = currentTime + 3600;

      await examVault
        .connect(examiner)
        .createExam(examId, sampleCID, unlockTime, sampleAESKey, [center1.address]);

      await expect(
        examVault
          .connect(examiner)
          .createExam(examId, sampleCID, unlockTime, sampleAESKey, [center1.address])
      ).to.be.revertedWith("Exam with this ID already exists");
    });

    it("should revert if unlockTime is not in the future", async function () {
      const currentTime = await time.latest();
      const pastTime = currentTime - 100;

      await expect(
        examVault
          .connect(examiner)
          .createExam(examId, sampleCID, pastTime, sampleAESKey, [center1.address])
      ).to.be.revertedWith("Unlock time must be in the future");
    });

    it("should revert if no authorized centers are provided", async function () {
      const currentTime = await time.latest();
      const unlockTime = currentTime + 3600;

      await expect(
        examVault
          .connect(examiner)
          .createExam(examId, sampleCID, unlockTime, sampleAESKey, [])
      ).to.be.revertedWith("At least one authorized exam center is required");
    });
  });

  describe("Access Control & Time Lock Enforcement", function () {
    let unlockTime;

    beforeEach(async function () {
      const currentTime = await time.latest();
      unlockTime = currentTime + 3600; // 1 hour ahead

      await examVault
        .connect(examiner)
        .createExam(examId, sampleCID, unlockTime, sampleAESKey, [center1.address]);
    });

    it("should revert if an authorized center calls before unlock time", async function () {
      await expect(
        examVault.connect(center1).getDecryptionKey(examId)
      ).to.be.revertedWith(
        "Access Denied: Exam paper is still time-locked. Unlock time has not arrived yet"
      );
    });

    it("should revert if an unauthorized account calls before unlock time", async function () {
      await expect(
        examVault.connect(unauthorizedAccount).getDecryptionKey(examId)
      ).to.be.revertedWith(
        "Access Denied: Caller is not an authorized exam center or examiner"
      );
    });

    it("should revert if an unauthorized account calls AFTER unlock time", async function () {
      await time.increaseTo(unlockTime + 10);

      await expect(
        examVault.connect(unauthorizedAccount).getDecryptionKey(examId)
      ).to.be.revertedWith(
        "Access Denied: Caller is not an authorized exam center or examiner"
      );
    });

    it("should return the decryption key to an authorized center AFTER unlock time", async function () {
      // Advance blockchain timestamp past unlockTime
      await time.increaseTo(unlockTime + 1);

      const retrievedKey = await examVault
        .connect(center1)
        .getDecryptionKey(examId);
      expect(retrievedKey).to.equal(sampleAESKey);
    });

    it("should also allow the examiner to retrieve the key after unlock time", async function () {
      await time.increaseTo(unlockTime + 10);

      const retrievedKey = await examVault
        .connect(examiner)
        .getDecryptionKey.staticCall(examId);
      expect(retrievedKey).to.equal(sampleAESKey);
    });
  });
});

