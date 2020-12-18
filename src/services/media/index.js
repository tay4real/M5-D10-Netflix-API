const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../lib/cloudinary");

const { check, validationResult } = require("express-validator");
const uniqid = require("uniqid");
const { getMedia, writeMedia } = require("../../lib/fsUtilities");

const mediaRouter = express.Router();

const mediaValidation = [
  check("Title").exists().withMessage("Title is required!"),
  check("Year").exists().withMessage("Year is required!"),
  check("Type").exists().withMessage("Type is required!"),
];

const reviewsValidation = [
  check("rate").exists().withMessage("Rate is required!"),
  check("comment").exists().withMessage("Comment is required!"),
];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stive-school/netflix",
  },
});

const cloudinaryMulter = multer({ storage: storage });

mediaRouter.get("/", async (req, res, next) => {
  try {
    const media = await getMedia();

    if (req.query && req.query.category) {
      const filteredMedia = media.filter(
        (med) =>
          med.hasOwnProperty("category") && med.category === req.query.category
      );
      res.send(filteredMedia);
    } else {
      res.send(media);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.get("/:medId", async (req, res, next) => {
  try {
    const media = await getMedia();

    const medFound = media.find((med) => med.imdbID === req.params.medId);

    if (medFound) {
      res.send(medFound);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.post("/", mediaValidation, async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);

    // const whiteList = ["Title", "Year", "Type"];

    if (!validationErrors.isEmpty()) {
      const error = new Error();
      error.httpStatusCode = 400;
      error.message = validationErrors;
      next(error);
    } else {
      const media = await getMedia();

      media.push({
        imdbID: uniqid(),
        ...req.body,
        Poster: "",
        createdAt: new Date(),
        updatedAt: new Date(),

        reviews: [],
      });
      await writeMedia(media);
      res.status(201).send();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.put("/:medId", mediaValidation, async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const error = new Error();
      error.httpStatusCode = 400;
      error.message = validationErrors;
      next(error);
    } else {
      const media = await getMedia();

      const medIndex = media.findIndex(
        (med) => med.imdbID === req.params.medId
      );

      if (medIndex !== -1) {
        // med found
        const updatedMedia = [
          ...media.slice(0, medIndex),
          { ...media[medIndex], ...req.body },
          ...media.slice(medIndex + 1),
        ];
        await writeMedia(updatedMedia);
        res.send(updatedMedia);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.delete("/:medId", async (req, res, next) => {
  try {
    const media = await getMedia();

    const medFound = media.find((med) => med.imdbID === req.params.medId);

    if (medFound) {
      const filteredMedia = media.filter(
        (med) => med.imdbID !== req.params.medId
      );

      await writeMedia(filteredMedia);
      res.send(filteredMedia);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.get("/:medId/reviews", async (req, res, next) => {
  try {
    const media = await getMedia();

    const medFound = media.find((med) => med.imdbID === req.params.medId);

    if (medFound) {
      res.send(medFound.reviews);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.get("/:medId/reviews/:reviewId", async (req, res, next) => {
  try {
    const media = await getMedia();

    const medFound = media.find((med) => med.imdbID === req.params.medId);

    if (medFound) {
      const reviewFound = medFound.reviews.find(
        (review) => review._id === req.params.reviewId
      );
      if (reviewFound) {
        res.send(reviewFound);
      } else {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.post(
  "/:medId/reviews",
  reviewsValidation,
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        const error = new Error();
        error.httpStatusCode = 400;
        error.message = validationErrors;
        next(error);
      } else {
        const media = await getMedia();

        const medIndex = media.findIndex(
          (med) => med.imdbID === req.params.medId
        );
        if (medIndex !== -1) {
          // med found
          media[medIndex].reviews.push({
            _id: uniqid(),
            ...req.body,
            createdAt: new Date(),
          });
          await writeMedia(media);
          res.status(201).send(media);
        } else {
          // med not found
          const error = new Error();
          error.httpStatusCode = 404;
          next(error);
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mediaRouter.put(
  "/:medId/reviews/:reviewId",
  reviewsValidation,
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        const error = new Error();
        error.httpStatusCode = 400;
        error.message = validationErrors;
        next(error);
      } else {
        const media = await getMedia();

        const medIndex = media.findIndex(
          (med) => med.imdbID === req.params.medId
        );

        if (medIndex !== -1) {
          const reviewIndex = media[medIndex].reviews.findIndex(
            (review) => review._id === req.params.reviewId
          );

          if (reviewIndex !== -1) {
            const previousReview = media[medIndex].reviews[reviewIndex];

            const updateReviews = [
              ...media[medIndex].reviews.slice(0, reviewIndex),
              { ...previousReview, ...req.body, updatedAt: new Date() },
              ...media[medIndex].reviews.slice(reviewIndex + 1),
            ];
            media[medIndex].reviews = updateReviews;

            await writeMedia(media);
            res.send(media);
          } else {
            console.log("Review not found");
          }
        } else {
          console.log("med not found");
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mediaRouter.delete("/:medId/reviews/:reviewId", async (req, res, next) => {
  try {
    const media = await getMedia();

    const medIndex = media.findIndex((med) => med.imdbID === req.params.medId);

    if (medIndex !== -1) {
      media[medIndex].reviews = media[medIndex].reviews.filter(
        (review) => review._id !== req.params.reviewId
      );

      await writeMedia(media);
      res.send(media);
    } else {
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mediaRouter.post(
  "/:medId/upload",
  cloudinaryMulter.single("med_image"),
  async (req, res, next) => {
    try {
      const media = await getMedia();

      const medIndex = media.findIndex(
        (med) => med.imdbID === req.params.medId
      );

      if (medIndex !== -1) {
        // med found
        const updatedMedia = [
          ...media.slice(0, medIndex),
          { ...media[medIndex], Poster: req.file.path },
          ...media.slice(medIndex + 1),
        ];
        await writeMedia(updatedMedia);
        res.send(updatedMedia);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = mediaRouter;
