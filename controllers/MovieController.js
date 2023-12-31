// controllers/MovieController.js
const Movie = require("../models/Movie");
const Genre = require("../models/Genre");
const Actor = require("../models/Actor");

const Country = require("../models/Country");
const { Op } = require("sequelize");
const until = require("../until");

exports.getMoviesByName = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
      },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      include: [{ model: Genre }, { model: Country }],
    });
    if (count === 0) {
      // Trả về một thông báo hoặc danh sách rỗng khi không có kết quả tìm kiếm
      return res.status(200).json({ movies: [], totalPages: 0 });
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ movies, totalPages });
  } catch (error) {
    console.error("Error searching for movies:", error); // Gỡ rối: in lỗi chi tiết
    res.status(500).json({ error: "Error searching for movies" });
  }
};

exports.getMovieById = async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.findByPk(movieId, {
      include: [{ model: Genre }, { model: Country },{model:Actor}],
    });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ error: "Error fetching movie" });
  }
};

exports.getMovies = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      include: [{ model: Genre }, { model: Country }],
    });
    if (count === 0) {
      // Trả về một thông báo hoặc danh sách rỗng khi không có kết quả tìm kiếm
      return res.status(200).json({ message: "No movies found" });
    }

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ movies, totalPages });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// Implement other methods here (getMoviesByGenre, getMoviesByCountry, createMovie, updateMovie, deleteMovie)
exports.getMoviesByGenre = async (req, res) => {
  try {
    const genreId = req.params.genreId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: { GenreId: genreId },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      include: [{ model: Genre }, { model: Country }],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ movies, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Error fetching movies by genre" });
  }
};

exports.getMoviesByCountry = async (req, res) => {
  try {
    const countryId = req.params.countryId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: { CountryId: countryId },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      include: [{ model: Genre }, { model: Country }],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ movies, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Error fetching movies by country" });
  }
};

exports.getMoviesByActor = async (req, res) => {
  try {
    const actorId = req.params.actorId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: { ActorId: actorId },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      include: [{ model: Genre }, { model: Country }],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ movies, totalPages });
  } catch (error) {
    res.status(500).json({ error: "Error fetching movies by actor" });
  }
};

exports.createMovie = async (req, res) => {
  try {
    const { name, genreId, countryId,actorId } = req.body;
    const imageUrl = req.files["imageUrl"][0]; // Tệp ảnh đã tải lên
    const videoUrl = req.files["videoUrl"][0]; // Tệp video đã tải lên
    let imageLink = await until.uploadCloudinry(imageUrl);
    let videoLink = await until.uploadCloudinry(videoUrl);
     // Lấy thông tin diễn viên dựa trên actorId
    const actor = await Actor.findByPk(actorId);
    const movieName = `[ ${actor.name} ] ${name}`;
    const movie = await Movie.create({
      name:movieName,
      imageUrl: imageLink,
      videoUrl: videoLink,
      GenreId: genreId,
      CountryId: countryId,
      ActorId:actorId
    });
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ error: "Error creating movie" });
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const { name, genreId, countryId,actorId } = req.body;
    const imageUrl = req.files["imageUrl"][0]; // Tệp ảnh đã tải lên
    const videoUrl = req.files["videoUrl"][0]; // Tệp video đã tải lên
    let imageLink = await until.uploadCloudinry(imageUrl);
    let videoLink = await until.uploadCloudinry(videoUrl);
    const [updatedRowsCount, updatedMovies] = await Movie.update(
      {
        name,
        imageUrl: imageLink,
        videoUrl: videoLink,
        GenreId: genreId,
        CountryId: countryId,
        ActorId:actorId
      },
      { where: { id: movieId }, returning: true }
    );
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.status(200).json(updatedMovies[0]);
  } catch (error) {
    res.status(500).json({ error: "Error updating movie" });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const deletedRowCount = await Movie.destroy({ where: { id: movieId } });
    if (deletedRowCount === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error deleting movie" });
  }
};

exports.getRelatedMovies = async (req, res) => {
  try {
    const movieId = req.params.id; // Lấy ID của phim được click

    // Lấy thông tin phim được click
    const clickedMovie = await Movie.findByPk(movieId, {
      include: [{ model: Genre }, { model: Country }],
    });

    if (!clickedMovie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Lấy danh sách phim liên quan (ngoại trừ phim được click)
    const relatedMovies = await Movie.findAll({
      where: {
        id: { [Op.ne]: clickedMovie.id }, // Loại bỏ phim được click khỏi danh sách
        // Điều kiện tùy ý khác để xác định phim liên quan (ví dụ: cùng thể loại, cùng quốc gia)
      },
      limit: 10, // Giới hạn số lượng phim liên quan
      include: [{ model: Genre }, { model: Country },{model:Actor}],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ clickedMovie, relatedMovies });
  } catch (error) {
    console.error("Error fetching related movies:", error);
    res.status(500).json({ error: "Error fetching related movies" });
  }
};

exports.increaseView = async (req, res) => {
  const movieId = req.params.movieId;
  try {
    // Tìm phim dựa trên movieId
    const movie = await Movie.findByPk(movieId);

    if (!movie) {
      return res.status(404).json({ error: 'Phim không tồn tại' });
    }

    // Tăng giá trị 'views' lên 1 và lưu vào cơ sở dữ liệu
    movie.view += 1;
    await movie.save();

    // Trả về phim để xem
    res.json({message:'sussec'});
  } catch (error) {
    res.status(500).json({ error: 'Lỗi trong quá trình xem phim' });
  }
};



exports.topmovieview = async (req, res) => {
  try {
    // Thực hiện truy vấn để lấy danh sách 15 bộ phim sắp xếp theo số lượt xem cao nhất
    const movies = await Movie.findAll({
      order: [['view', 'DESC']], // Sắp xếp theo số lượt xem giảm dần
      limit: 15, // Giới hạn số lượng kết quả trả về
    });

    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình lấy danh sách phim theo số lượt xem cao nhất' });
  }
};

