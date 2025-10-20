import { Response } from "express";
import UserModel from "../models/UserModel";
import ResponseUtil from "../utils/Response/responseUtils";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import { CustomRequest } from "../interfaces/auth";

export const home = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const updateLocation = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getTherapistDetails = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const bookSession = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const myBookings = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const bookingDetails = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const reviewTherapist = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const cancelBooking = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const resources = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const detailResource = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const listKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const addKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const deleteKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
