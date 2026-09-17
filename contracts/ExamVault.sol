// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ExamVault
 * @dev Decentralized time-locked exam paper security vault.
 * Secures encrypted exam paper CIDs and decryption keys until a specified unlock timestamp.
 */
contract ExamVault {
    struct Exam {
        string ipfsCID;
        uint256 unlockTime;
        string encryptedKey;
        address examiner;
        bool exists;
    }

    // Mapping from examId to Exam struct
    mapping(uint256 => Exam) public exams;

    // Mapping from examId to authorized exam center addresses
    mapping(uint256 => mapping(address => bool)) public isAuthorizedCenter;

    // Events
    event ExamCreated(
        uint256 indexed examId,
        string ipfsCID,
        uint256 unlockTime,
        address indexed examiner,
        uint256 authorizedCenterCount
    );

    event KeyUnlocked(
        uint256 indexed examId,
        address indexed caller,
        uint256 timestamp
    );

    // Modifiers
    modifier examMustExist(uint256 _examId) {
        require(exams[_examId].exists, "Exam does not exist");
        _;
    }

    modifier onlyAuthorized(uint256 _examId) {
        require(exams[_examId].exists, "Exam does not exist");
        require(
            isAuthorizedCenter[_examId][msg.sender] || exams[_examId].examiner == msg.sender,
            "Access Denied: Caller is not an authorized exam center or examiner"
        );
        _;
    }

    modifier onlyUnlocked(uint256 _examId) {
        require(exams[_examId].exists, "Exam does not exist");
        require(
            block.timestamp >= exams[_examId].unlockTime,
            "Access Denied: Exam paper is still time-locked. Unlock time has not arrived yet"
        );
        _;
    }

    /**
     * @notice Registers a new encrypted exam paper into the vault.
     * @param _examId Unique identifier for the exam
     * @param _ipfsCID IPFS CID of the encrypted PDF exam paper
     * @param _unlockTime UNIX timestamp when the exam paper decryption key unlocks
     * @param _encryptedKey The AES-256 decryption key for the exam paper
     * @param _authorizedCenters Array of wallet addresses for authorized exam centers
     */
    function createExam(
        uint256 _examId,
        string memory _ipfsCID,
        uint256 _unlockTime,
        string memory _encryptedKey,
        address[] memory _authorizedCenters
    ) external {
        require(!exams[_examId].exists, "Exam with this ID already exists");
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(bytes(_encryptedKey).length > 0, "Decryption key cannot be empty");
        require(_authorizedCenters.length > 0, "At least one authorized exam center is required");

        // Save Exam struct
        exams[_examId] = Exam({
            ipfsCID: _ipfsCID,
            unlockTime: _unlockTime,
            encryptedKey: _encryptedKey,
            examiner: msg.sender,
            exists: true
        });

        // Whitelist authorized centers
        for (uint256 i = 0; i < _authorizedCenters.length; i++) {
            address center = _authorizedCenters[i];
            require(center != address(0), "Invalid center address");
            isAuthorizedCenter[_examId][center] = true;
        }

        emit ExamCreated(
            _examId,
            _ipfsCID,
            _unlockTime,
            msg.sender,
            _authorizedCenters.length
        );
    }

    /**
     * @notice Retrieves the decryption key for an exam once time-lock expires.
     * @dev Only callable by authorized exam centers or the examiner after the unlock time has elapsed.
     * @param _examId Unique exam identifier
     * @return The AES decryption key
     */
    function getDecryptionKey(uint256 _examId)
        external
        view
        onlyAuthorized(_examId)
        onlyUnlocked(_examId)
        returns (string memory)
    {
        return exams[_examId].encryptedKey;
    }


    /**
     * @notice View function to get exam metadata (CID and unlock status) without exposing the secret key.
     * @param _examId Unique exam identifier
     * @param _center Center address to check authorization for
     */
    function getExamMetadata(uint256 _examId, address _center)
        external
        view
        examMustExist(_examId)
        returns (
            string memory ipfsCID,
            uint256 unlockTime,
            address examiner,
            bool isCallerAuthorized,
            bool isUnlocked,
            uint256 currentBlockTimestamp
        )
    {
        Exam storage exam = exams[_examId];
        bool authorized = isAuthorizedCenter[_examId][_center] || exam.examiner == _center;
        bool unlocked = block.timestamp >= exam.unlockTime;

        return (
            exam.ipfsCID,
            exam.unlockTime,
            exam.examiner,
            authorized,
            unlocked,
            block.timestamp
        );
    }

    /**
     * @notice Checks if an address is authorized for a specific exam.
     */
    function isCenterWhitelisted(uint256 _examId, address _center)
        external
        view
        returns (bool)
    {
        return isAuthorizedCenter[_examId][_center] || exams[_examId].examiner == _center;
    }
}

