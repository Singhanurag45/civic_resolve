import { Request, Response } from "express";
import { IssueModel } from "../models/issue.model";
import { CounterModel } from "../models/counter.model";
import { MultimediaModel } from "../models/multimedia.model";
import { isValidDepartment, getDepartments as getDepts } from "../utils/departments";
import { AdminModel } from "../models/admin.model";

export const createIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = ((req as any).files as Express.Multer.File[]) || [];

    const { title = "Untitled", description, location, issueType, department } = req.body;
    
    // Debug logging
    console.log("Received data:", {
      title,
      description: description?.substring(0, 50),
      issueType,
      department,
      location: typeof location,
      citizenId: (req as any).citizenId,
    });

    // location stuff
    let parsedLocation = location;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        res.status(400).json({ message: "Invalid location JSON format" });
        return;
      }
    }

    if (
      !title ||
      !description ||
      !parsedLocation ||
      !parsedLocation.latitude ||
      !parsedLocation.longitude ||
      !issueType ||
      !department
    ) {
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
    if (!isValidDepartment(department)) {
      res.status(400).json({ 
        message: "Invalid department. Must be one of: MCD, PWD, Traffic, Water Supply, Electricity",
        received: department
      });
      return;
    }

    const existingIssue = await IssueModel.findOne({ title });
    if (existingIssue) {
      res
        .status(400)
        .json({ message: " Issue with this title already exists" });
      return;
    }

    // Generate human-readable unique ID (RP-YYMMDD-HHMMSS-NNNN)
    const counter = await CounterModel.findOneAndUpdate(
      { _id: "issueIdCounter" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const MM = String(now.getMinutes()).padStart(2, "0");
    const SS = String(now.getSeconds()).padStart(2, "0");
    const seqPadded = String(counter.seq).padStart(4, "0");
    const customIssueId = `RP-${yy}${mm}${dd}-${HH}${MM}${SS}-${seqPadded}`;

    const issue = await IssueModel.create({
      customIssueId,
      citizenId: (req as any).citizenId, // Adapt as per your auth
      issueType,
      title,
      description,
      location: parsedLocation,
      department,
      status: "Reported",
    });

    const mediaDocs = await Promise.all(
      files.map((file) =>
        MultimediaModel.create({
          issueID: issue._id,
          fileType: file.mimetype.startsWith("video") ? "video" : "image",
          url: file.path,
          filename: file.originalname,
        })
      )
    );
    console.log("Response body:", {
      message: "Issue created",
      media: mediaDocs,
    });

    res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
  } catch (error: any) {
    console.error("Error creating issue:", error);
    // Log the full error for debugging
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    // If requester is an admin, filter issues by their department
    let query: Record<string, unknown> = {};
    if ((req as any).role === "admin" && (req as any).adminId) {
      const admin = await AdminModel.findById((req as any).adminId).lean();
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      if ((admin as any).department) {
        query = { department: (admin as any).department };
      }
    }

    const issues = await IssueModel.find(query)
      .populate("citizenId", "fullName")
      .lean();

    const issuesWithMedia = await Promise.all(
      issues.map(async (issue) => {
        const media = await MultimediaModel.find({ issueID: issue._id });
        return {
          _id: issue._id,
          title: issue.title,
          description: issue.description,
          type: issue.issueType,
          location: issue.location, //  send only address
          department: issue.department,
          reportedBy: (issue.citizenId as any)?.fullName || "Anonymous",
          reportedAt: issue.createdAt,
          image: media.length > 0 ? media[0].url : null,
          status: issue.status,
        };
      })
    );

    res.json({ issues: issuesWithMedia });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = getDepts();
    res.json({ departments });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
