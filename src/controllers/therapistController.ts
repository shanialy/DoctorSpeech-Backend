import { Response } from "express";
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

export const bookingDetail = async (req: CustomRequest, res: Response) => {
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
export const respondBooking = async (req: CustomRequest, res: Response) => {
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

export const reviewUser = async (req: CustomRequest, res: Response) => {
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

export const earnings = async (req: CustomRequest, res: Response) => {
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
