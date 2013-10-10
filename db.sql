--
-- База данных: `selection`
--

CREATE DATABASE `selection` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `selection`;

-- --------------------------------------------------------

--
-- Структура таблицы `comet`
--

CREATE TABLE IF NOT EXISTS `comet` (
  `ID` int(11) NOT NULL,
  `Time` datetime NOT NULL,
  `IDlast` int(11) NOT NULL,
  `IDclient` int(11) NOT NULL,
  `comment` int(11) NOT NULL,
  `has_reply` tinyint(1) NOT NULL,
  `selected_block` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- --------------------------------------------------------

--
-- Структура таблицы `comments`
--

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_reply_str` varchar(250) NOT NULL,
  `id_user` int(11) NOT NULL,
  `comment` longtext NOT NULL,
  `datatime` datetime NOT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ;

-- --------------------------------------------------------

--
-- Структура таблицы `selected_blocks`
--

CREATE TABLE IF NOT EXISTS `selected_blocks` (
  `id` int(11) NOT NULL,
  `comments` text NOT NULL,
  `startPos` int(11) NOT NULL,
  `endPos` int(11) NOT NULL,
  `selectedtext` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Структура таблицы `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idNet` bigint(20) NOT NULL,
  `NameNet` varchar(12) NOT NULL,
  `nickname` varchar(40) NOT NULL,
  `url_photo` varchar(100) NOT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
