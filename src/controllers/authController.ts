import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import AuthConfig from "../config/authConfig";
import { compare, hash } from "bcrypt";
import ResponseUtil from "../utils/Response/responseUtils";
import {
  changePasswordSchema,
  createProfileSchema,
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema,
} from "../validators/authValidators";
import { compareSync } from "bcrypt";
import { generateToken } from "../utils/Token";
import { randomInt } from "crypto";
import { sendEmail } from "../utils/SendEmail";
import { emailTemplateGeneric } from "../utils/SendEmail/templates";
import { OtpModel } from "../models/OtpModel";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import { makeURL } from "../utils/BaseUrlConcatinator";
import { CustomRequest } from "../interfaces/auth";
import DeviceModel from "../models/DevicesModel";
import CertificationModel from "../models/CertificationModel";
import SlotModel from "../models/SlotModel";
import BookingModel from "../models/BookingModel";
import ReviewModel from "../models/ReviewModel";

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceToken, deviceType, userType } =
      signupSchema.parse(req.body);
    const userExist = await UserModel.findOne({
      email: email,
    });
    if (userExist) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        AUTH_CONSTANTS.USER_ALREADY_EXISTS
      );
    }
    const hashPassword = await hash(password, String(AuthConfig.SALT));
    const user = await UserModel.create({
      email: email,
      password: hashPassword,
      userType,
    });
    const otp = randomInt(100000, 999999);
    // const otp = 111111;
    await OtpModel.create({
      userId: user._id,
      otp: String(otp),
    });
    const template = emailTemplateGeneric(otp);
    let devices = await DeviceModel.find({ deviceToken });

    await Promise.all([
      sendEmail(email, AUTH_CONSTANTS.VERIFICATION_CODE, template),
      DeviceModel.deleteMany({ deviceToken }),
      UserModel.updateMany(
        {},
        {
          $pull: { devices: { $in: devices.map((d) => d._id) } },
        }
        // { new: true }
      ),
    ]);

    const device = await DeviceModel.create({
      deviceToken,
      deviceType,
      user: String(user._id),
    });

    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $addToSet: { devices: device._id },
      },
      { new: true }
    );

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user },
      AUTH_CONSTANTS.OTP_SENT
    );
  } catch (error: any) {
    return ResponseUtil.handleError(res, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceToken, deviceType } = loginSchema.parse(
      req.body
    );
    let user: any = await UserModel.findOne({ email });

    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }

    const hashpass = compareSync(password, String(user.password));

    if (!hashpass) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        AUTH_CONSTANTS.PASSWORD_MISMATCH
      );
    }

    // if (user.userType != userType) {
    //   return ResponseUtil.errorResponse(
    //     res,
    //     STATUS_CODES.NOT_FOUND,
    //     "User not Found"
    //   );
    // }
    const token = generateToken({
      email: email,
      id: String(user._id),
      userType: String(user.userType),
    });

    user = user.toObject();
    delete user.password;
    // delete user.devices;
    // delete user.workingSlots;
    // delete user.certifications;

    if (!user.isVerified) {
      return ResponseUtil.successResponse(
        res,
        STATUS_CODES.SUCCESS,
        { user },
        AUTH_CONSTANTS.NOT_VERIFIED
      );
    }

    if (!user.isProfileCompleted) {
      return ResponseUtil.successResponse(
        res,
        STATUS_CODES.SUCCESS,
        { token, user },
        AUTH_CONSTANTS.INCOMPLETE_PROFILE
      );
    }

    let devices = await DeviceModel.find({ deviceToken });
    await Promise.all([
      DeviceModel.deleteMany({ deviceToken }),
      UserModel.updateMany(
        {},
        {
          $pull: { devices: { $in: devices.map((d) => d._id) } },
        }
      ),
    ]);

    const device = await DeviceModel.create({
      deviceToken,
      deviceType,
      user: String(user._id),
    });

    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $addToSet: { devices: device._id },
      },
      { new: true }
    );

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user, token },
      AUTH_CONSTANTS.LOGGED_IN
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { otp, email } = otpVerifySchema.parse(req.body);
    const findUser = await UserModel.findOne({ email: email });
    const otpRes = await OtpModel.findOne({ userId: findUser?._id });

    if (!otpRes) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.INVALID_OTP
      );
    }

    if (otpRes && otpRes.otp != otp) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        AUTH_CONSTANTS.INVALID_OTP
      );
    }

    if (otpRes && new Date() > otpRes.expiry) {
      await OtpModel.findByIdAndDelete(otpRes._id);
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        AUTH_CONSTANTS.OTP_EXPIRED
      );
    }

    const user = await UserModel.findByIdAndUpdate(findUser?._id, {
      isVerified: true,
    });
    if (user && user.email) {
      await OtpModel.findByIdAndDelete(otpRes._id);
      const token = generateToken({
        email: user.email,
        id: String(findUser?._id),
        userType: String(user.userType),
      });

      return ResponseUtil.successResponse(
        res,
        STATUS_CODES.SUCCESS,
        { token },
        AUTH_CONSTANTS.OTP_VERIFIED
      );
    }
    return ResponseUtil.errorResponse(
      res,
      STATUS_CODES.NOT_FOUND,
      AUTH_CONSTANTS.USER_NOT_FOUND
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const createProfile = async (req: any, res: Response) => {
  try {
    let profilePicture = "";

    if (
      req.filesInfo &&
      req.filesInfo.profilePicture &&
      req.filesInfo.profilePicture.length
    ) {
      profilePicture = req.filesInfo.profilePicture[0].url;
    }
    // if (req.body.latitude && req.body.longitude) {
    //   req.body["location"] = {
    //     type: "Point",
    //     coordinates: [
    //       parseFloat(req.body.longitude),
    //       parseFloat(req.body.latitude),
    //     ],
    //     address: req.body.address || "",
    //   };
    // }
    let user: any;
    // if (req.userType == "User") {
    user = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        ...req.body,
        isProfileCompleted: true,
        profilePicture,
      },
      { new: true }
    );
    // }
    // if (req.userType == "Therapist") {
    //   let addedSlots = false;
    //   const { certifications, slots, latitude, longitude, address, ...rest } =
    //     req.body;
    //   if (
    //     rest["speciality.text"] &&
    //     typeof rest["speciality.text"] === "string"
    //   ) {
    //     try {
    //       rest["speciality.text"] = JSON.parse(rest["speciality.text"]);
    //     } catch (err) {
    //       console.error("Invalid speciality.text JSON:", err);
    //       rest["speciality.text"] = []; // fallback to empty array if parsing fails
    //     }
    //   }
    //   const parsedCertifications = JSON.parse(certifications);
    //   const parsedSlots = JSON.parse(slots);
    //   const uploadedMedia = req.filesInfo?.certificationMedia || [];
    //   await Promise.all(
    //     parsedCertifications.map(async (cert: any, index: number) => {
    //       const file = uploadedMedia[index];
    //       return await CertificationModel.create({
    //         user: req.userId,
    //         degreeName: cert.degreeName,
    //         instituteName: cert.instituteName,
    //         completionYear: cert.completionYear,
    //         media: file
    //           ? {
    //               mediaType: file.contentType,
    //               url: file.url,
    //             }
    //           : undefined,
    //       });
    //     })
    //   );
    //   const slotDocs = parsedSlots
    //     .filter(
    //       (slot: any) => Array.isArray(slot.times) && slot.times.length > 0
    //     )
    //     .map((slot: any) => ({
    //       therapist: req.userId,
    //       day: slot.day,
    //       times: slot.times.map((time: any) => ({
    //         startTime: time.startTime,
    //         endTime: time.endTime,
    //       })),
    //     }));

    //   if (slotDocs.length > 0) {
    //     addedSlots = true;
    //     await SlotModel.insertMany(slotDocs);
    //   }

    //   user = await UserModel.findByIdAndUpdate(
    //     req.userId,
    //     {
    //       ...rest,
    //       ...(rest.sessionCharges && {
    //         sessionCharges: Number(rest.sessionCharges),
    //       }),
    //       isProfileCompleted: true,
    //       profilePicture,
    //       isSelectSlots: addedSlots,
    //     },
    //     { new: true }
    //   );
    // }

    const token = generateToken({
      email: String(user.email),
      id: String(req.userId),
      userType: String(user.userType),
    });

    user = user.toObject();
    delete user.password;
    // delete user.devices;
    // delete user.workingSlots;
    // delete user.certifications;

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user, token },
      AUTH_CONSTANTS.PROFILE_CREATED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = otpSendSchema.parse(req.body);
    const user = await UserModel.findOne({ email });
    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }
    const otp = randomInt(100000, 999999);
    // const otp = 111111;
    const model = await OtpModel.findOneAndUpdate(
      { userId: user._id },
      { otp: String(otp), expiry: new Date(Date.now() + 10 * 60 * 1000) }
    );
    if (!model) {
      OtpModel.create({
        userId: user._id,
        otp: String(otp),
      });
    }
    const template = emailTemplateGeneric(otp);
    await sendEmail(email, AUTH_CONSTANTS.VERIFICATION_CODE, template);
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.OTP_SENT
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getProfile = async (req: CustomRequest, res: Response) => {
  try {
    let user: any = await UserModel.findById(req.userId);

    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }

    user = user.toObject();
    delete user.password;
    // delete user.devices;
    // delete user.certifications;

    // if (req.userType == "Therapist") {
    //   user.workingSlots = await SlotModel.find({
    //     therapist: req.userId,
    //   }).lean();
    // }
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user },
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const changePassword = async (req: CustomRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }
    const matchedpassword = await compare(oldPassword, user.password as string);
    if (!matchedpassword) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        AUTH_CONSTANTS.OLD_PASSWORD_NOT_MATCHED
      );
    }
    const password = await hash(newPassword, AuthConfig.SALT as string);

    await UserModel.findByIdAndUpdate(req.userId, {
      password: password,
    });

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.PASSWORD_CHANGED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    let profilePicture = undefined;

    if (
      req.filesInfo &&
      req.filesInfo.profilePicture &&
      req.filesInfo.profilePicture.length
    ) {
      profilePicture = req.filesInfo.profilePicture[0].url;
    }

    if (profilePicture) {
      req["body"]["profilePicture"] = profilePicture;
    }

    // if (req.body.latitude && req.body.longitude) {
    //   req.body["location"] = {
    //     type: "Point",
    //     coordinates: [
    //       parseFloat(req.body.longitude),
    //       parseFloat(req.body.latitude),
    //     ],
    //     address: req.body.address || "",
    //   };
    // }

    // const { latitude, longitude, address, ...rest } = req.body;

    let user: any = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        ...req.body,
      },
      { new: true }
    );
    user = user.toObject();
    delete user.password;
    // delete user.devices;
    // delete user.workingSlots;
    // delete user.certifications;
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user },
      AUTH_CONSTANTS.PROFILE_UPDATED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const resetPassword = async (req: CustomRequest, res: Response) => {
  try {
    const { password } = resetPasswordSchema.parse(req.body);

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }

    const newPassword = await hash(password, AuthConfig.SALT as string);

    await UserModel.findByIdAndUpdate(req.userId, {
      password: newPassword,
    });

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.PASSWORD_RESET
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getUserById = async (req: CustomRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "UserId Required"
      );
    }

    let user: any = await UserModel.findById(userId);
    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.USER_NOT_FOUND
      );
    }

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { user },
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const logout = async (req: CustomRequest, res: Response) => {
  try {
    const { deviceToken } = req.body;

    const device = await DeviceModel.findOneAndDelete({
      deviceToken,
      user: req.userId,
    });
    if (!device) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Already logged out from this device"
      );
    }
    await UserModel.findByIdAndUpdate(req.userId, {
      $pull: { devices: device._id },
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.LOGGED_OUT
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const deleteAccount = async (req: CustomRequest, res: Response) => {
  try {
    await Promise.all([
      SlotModel.deleteMany({ therapist: req.userId }).catch(() => null),
      BookingModel.deleteMany({
        $or: [{ therapist: req.userId }, { bookedBy: req.userId }],
      }).catch(() => null),
      ReviewModel.deleteMany({
        $or: [{ therapist: req.userId }, { user: req.userId }],
      }).catch(() => null),
      DeviceModel.deleteMany({ user: req.userId }).catch(() => null),
      CertificationModel.deleteMany({ user: req.userId }).catch(() => null),
    ]);
    await UserModel.deleteOne({
      _id: req.userId,
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Deleted successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

// export const socialLogin = async (req: CustomRequest, res: Response) => {
//   try {
//     const { accessToken, deviceToken, deviceType, provider } = req.body;
//     const userDetailsFromToken: any = jwt.decode(accessToken);
//     if (!userDetailsFromToken || !userDetailsFromToken.email_verified) {
//       return ResponseUtil.errorResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         "Invalid credentials"
//       );
//     }

//     let user: any = await UserModel.findOne({
//       email: userDetailsFromToken.email,
//     })
//       .select("-blocked -devices")
//       .populate([
//         {
//           path: "posts",
//           populate: [
//             { path: "user", select: USER_DETAILS },
//             { path: "likes.user", select: USER_DETAILS },
//             {
//               path: "comments.user",
//               select: USER_DETAILS,
//             },
//             {
//               path: "comments.replies.user",
//               select: USER_DETAILS,
//             },
//           ],
//         },
//         {
//           path: "partner",
//           populate: {
//             path: "shorts",
//           },
//           select: REMOVE_PARTNER_FIELDS,
//         },
//       ])
//       .populate("shorts");

//     if (!user) {
//       user = await UserModel.create({
//         providerId: userDetailsFromToken.sub,
//         provider: provider,
//         email: userDetailsFromToken.email,
//         name: userDetailsFromToken.given_name,
//         isVerified: true,
//         profilePicture: userDetailsFromToken.picture,
//       });
//     }

//     let devices = await DeviceModel.find({ deviceToken });
//     await Promise.all([
//       DeviceModel.deleteMany({ deviceToken }),
//       UserModel.updateMany(
//         {},
//         {
//           $pull: { devices: { $in: devices.map((d) => d._id) } },
//         }
//         // { new: true }
//       ),
//     ]);

//     const device = await DeviceModel.create({
//       deviceToken,
//       deviceType,
//       user: String(user._id),
//     });

//     await UserModel.findByIdAndUpdate(
//       user._id,
//       {
//         $addToSet: { devices: device._id },
//       },
//       { new: true }
//     );

//     const token = generateToken({
//       email: String(user.email),
//       id: String(user._id),
//       name: String(user.name),
//     });

//     if (!user.isProfileCompleted) {
//       return ResponseUtil.successResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         { token },
//         AUTH_CONSTANTS.INCOMPLETE_PROFILE
//       );
//     }

//     user = user.toObject();
//     delete user.password;

//     const posts = user.posts.map((post: any) => {
//       const likedByOwn = post.likes.find(
//         (like: any) => like.user._id.toString() === user._id.toString()
//       );
//       return {
//         ...post,
//         likedByOwn: { type: likedByOwn ? likedByOwn.type : null },
//       };
//     });

//     if (user.partner) {
//       const matchPercentage = calculateMatchPercentage(user, user.partner);
//       user.partner = {
//         user: user.partner,
//         matchPercentage: matchPercentage,
//       };
//     }

//     return ResponseUtil.successResponse(
//       res,
//       STATUS_CODES.SUCCESS,
//       { user: { ...user, posts }, token },
//       AUTH_CONSTANTS.LOGGED_IN
//     );
//   } catch (error) {
//     return ResponseUtil.handleError(res, error);
//   }
// };
