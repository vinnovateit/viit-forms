import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FormSubmission from "@/models/Members";

interface FormSubmissionBody {
  personalInfo: {
    regNumber: string;
    vitEmail: string;
    personalEmail: string;
    [key: string]: string | number | boolean | undefined;
  };
  domainInfo: {
    domain: string;
    [key: string]: string | undefined;
  };
  commitmentInfo: {
    likedSenior: string;
    commitment: number;
    commitmentJustification: string;
  };
}

// Helper: Flattens nested objects for MongoDB $set
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.keys(obj).reduce((acc: Record<string, unknown>, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    const value = obj[k];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Cast 'value' to Record<string, unknown> to satisfy recursive call
      Object.assign(acc, flattenObject(value as Record<string, unknown>, pre + k));
    } else {
      acc[pre + k] = value;
    }
    return acc;
  }, {});
}

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json() as FormSubmissionBody;
    
    if (!body.personalInfo || !body.domainInfo || !body.commitmentInfo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required form sections (personalInfo, domainInfo, commitmentInfo)" 
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingReg = await FormSubmission.findOne({
      'personalInfo.regNumber': body.personalInfo.regNumber
    });
    if (existingReg) {
      return new Response(
        JSON.stringify({ success: false, error: "Registration number already submitted" }), 
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingEmail = await FormSubmission.findOne({
        $or: [
            { 'personalInfo.vitEmail': body.personalInfo.vitEmail },
            { 'personalInfo.personalEmail': body.personalInfo.personalEmail }
        ]
    });
    if (existingEmail) {
        return new Response(
          JSON.stringify({ success: false, error: "Email already submitted" }), 
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
    }

    const formSubmission = await FormSubmission.create({
      ...body,
      submittedAt: new Date(),
      status: 'submitted'
    });

    return new Response(
      JSON.stringify({ success: true, data: formSubmission, message: "Submitted successfully!" }), 
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Submission failed";
    console.error('Submission error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    
    // --- NEW: Handle single user lookup for the frontend form ---
    const regNumber = searchParams.get('regNumber');
    if (regNumber) {
      const member = await FormSubmission.findOne({ 'personalInfo.regNumber': regNumber }).lean();
      
      if (!member) {
        return new Response(
          JSON.stringify({ success: false, error: "Member not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, data: member }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    // -------------------------------------------------------------

    // Handle standard list/pagination lookups
    const status = searchParams.get('status');
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (domain) filter['domainInfo.domain'] = domain;
    
    const skip = (page - 1) * limit;
    
    const formSubmissions = await FormSubmission.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    const totalCount = await FormSubmission.countDocuments(filter);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formSubmissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        }
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { regNumber, ...updateData } = body;

    if (!regNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Registration number is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Flatten the payload dynamically
    const flattenedUpdates = flattenObject(updateData);

    const updatedSubmission = await FormSubmission.findOneAndUpdate(
      { 'personalInfo.regNumber': regNumber },
      { $set: flattenedUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return new Response(
        JSON.stringify({ success: false, error: "Member not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: updatedSubmission, message: "Updated successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Update failed";
    console.error('Update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}