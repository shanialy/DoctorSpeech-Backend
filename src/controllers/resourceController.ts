import { Response } from "express";
import ResponseUtil from "../utils/Response/responseUtils";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import ResourceModel from "../models/ResourceModel";

export const createResource = async (req: any, res: Response) => {
  try {
    const {
      resourceId,
      title,
      description,
      alphabet,
      videoTitle,
      videoDescription,
    } = req.body;
    let videos = [];

    // Handle file uploads (frontView, fullView, sideView)
    if (req.filesInfo) {
      if (req.filesInfo.frontView?.length) {
        videos.push({
          type: "frontView",
          title: videoTitle,
          description: videoDescription,
          url: req.filesInfo.frontView[0].url,
        });
      }
      if (req.filesInfo.fullView?.length) {
        videos.push({
          type: "fullView",
          title: videoTitle,
          description: videoDescription,
          url: req.filesInfo.fullView[0].url,
        });
      }
      if (req.filesInfo.sideView?.length) {
        videos.push({
          type: "sideView",
          title: videoTitle,
          description: videoDescription,
          url: req.filesInfo.sideView[0].url,
        });
      }
    }

    let resource;

    if (!resourceId) {
      if (!title) {
        return ResponseUtil.errorResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          "Title is required for creating a new resource"
        );
      }

      resource = await ResourceModel.create({
        title,
        description,
        alphabets: alphabet
          ? [
              {
                letter: alphabet.letter,
                acquisitionAge: alphabet.acquisitionAge,
                videos,
              },
            ]
          : [],
      });

      return ResponseUtil.successResponse(
        res,
        STATUS_CODES.SUCCESS,
        resource,
        AUTH_CONSTANTS.PROFILE_CREATED
      );
    }

    const existing = await ResourceModel.findById(resourceId);
    if (!existing) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Resource not found"
      );
    }

    if (alphabet?.letter && alphabet?.acquisitionAge) {
      existing.alphabets.push({
        letter: alphabet.letter,
        acquisitionAge: alphabet.acquisitionAge,
        videos,
      });
    }

    if (alphabet?.letter && !alphabet.acquisitionAge && videos.length) {
      const targetAlphabet = existing.alphabets.find(
        (a: any) => a.letter === alphabet.letter
      );
      if (targetAlphabet) {
        targetAlphabet.videos.push(...videos);
      }
    }

    if (title) existing.title = title;
    if (description) existing.description = description;

    resource = await existing.save();

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      resource,
      "Resource updated successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
