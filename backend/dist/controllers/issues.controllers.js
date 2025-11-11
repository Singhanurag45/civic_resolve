"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartments = exports.getIssues = exports.createIssue = void 0;
const issue_model_1 = require("../models/issue.model");
const counter_model_1 = require("../models/counter.model");
const multimedia_model_1 = require("../models/multimedia.model");
const departments_1 = require("../utils/departments");
const admin_model_1 = require("../models/admin.model");
const createIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files || [];
        const { title = "Untitled", description, location, issueType, department } = req.body;
        // Debug logging
        console.log("Received data:", {
            title,
            description: description === null || description === void 0 ? void 0 : description.substring(0, 50),
            issueType,
            department,
            location: typeof location,
            citizenId: req.citizenId,
        });
        // location stuff
        let parsedLocation = location;
        if (typeof location === "string") {
            try {
                parsedLocation = JSON.parse(location);
            }
            catch (_a) {
                res.status(400).json({ message: "Invalid location JSON format" });
                return;
            }
        }
        if (!title ||
            !description ||
            !parsedLocation ||
            !parsedLocation.latitude ||
            !parsedLocation.longitude ||
            !issueType ||
            !department) {
            res.status(400).json({
                message: "Please fill all the required fields",
                missing: {
                    title: !title,
                    description: !description,
                    location: !parsedLocation || !parsedLocation.latitude || !parsedLocation.longitude,
                    issueType: !issueType,
                    department: !department,
                }
            });
            return;
        }
        // Validate department
        if (!(0, departments_1.isValidDepartment)(department)) {
            res.status(400).json({
                message: "Invalid department. Must be one of: MCD, PWD, Traffic, Water Supply, Electricity",
                received: department
            });
            return;
        }
        const existingIssue = yield issue_model_1.IssueModel.findOne({ title });
        if (existingIssue) {
            res
                .status(400)
                .json({ message: " Issue with this title already exists" });
            return;
        }
        // Generate human-readable unique ID (RP-YYMMDD-HHMMSS-NNNN)
        const counter = yield counter_model_1.CounterModel.findOneAndUpdate({ _id: "issueIdCounter" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const HH = String(now.getHours()).padStart(2, "0");
        const MM = String(now.getMinutes()).padStart(2, "0");
        const SS = String(now.getSeconds()).padStart(2, "0");
        const seqPadded = String(counter.seq).padStart(4, "0");
        const customIssueId = `RP-${yy}${mm}${dd}-${HH}${MM}${SS}-${seqPadded}`;
        const issue = yield issue_model_1.IssueModel.create({
            customIssueId,
            citizenId: req.citizenId, // Adapt as per your auth
            issueType,
            title,
            description,
            location: parsedLocation,
            department,
            status: "Reported",
        });
        const mediaDocs = yield Promise.all(files.map((file) => multimedia_model_1.MultimediaModel.create({
            issueID: issue._id,
            fileType: file.mimetype.startsWith("video") ? "video" : "image",
            url: file.path,
            filename: file.originalname,
        })));
        console.log("Response body:", {
            message: "Issue created",
            media: mediaDocs,
        });
        res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
    }
    catch (error) {
        console.error("Error creating issue:", error);
        // Log the full error for debugging
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({ message: "Issue with this title already exists" });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});
exports.createIssue = createIssue;
const getIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // If requester is an admin, filter issues by their department
        let query = {};
        if (req.role === "admin" && req.adminId) {
            const admin = yield admin_model_1.AdminModel.findById(req.adminId).lean();
            if (!admin) {
                res.status(404).json({ message: "Admin not found" });
                return;
            }
            if (admin.department) {
                query = { department: admin.department };
            }
        }
        const issues = yield issue_model_1.IssueModel.find(query)
            .populate("citizenId", "fullName")
            .lean();
        const issuesWithMedia = yield Promise.all(issues.map((issue) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const media = yield multimedia_model_1.MultimediaModel.find({ issueID: issue._id });
            return {
                _id: issue._id,
                title: issue.title,
                description: issue.description,
                type: issue.issueType,
                location: issue.location, //  send only address
                department: issue.department,
                reportedBy: ((_a = issue.citizenId) === null || _a === void 0 ? void 0 : _a.fullName) || "Anonymous",
                reportedAt: issue.createdAt,
                image: media.length > 0 ? media[0].url : null,
                status: issue.status,
            };
        })));
        res.json({ issues: issuesWithMedia });
    }
    catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
exports.getIssues = getIssues;
const getDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const departments = (0, departments_1.getDepartments)();
        res.json({ departments });
    }
    catch (err) {
        console.error("Error fetching departments:", err);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
exports.getDepartments = getDepartments;
