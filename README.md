Comment_text
============

Plugin for comment text

НАСТРОЙКИ ВЕБ-СЕРВЕРА<br>
Серверная часть построена по технологии REST API,для нормальной работы которого в веб сервере Apache должен быть 
подключен модуль mod_rewrite.В настройках httpd для локальной дирректории должны быть прописаны следующие свойства для 
правильной работы htaccess:<br>
  Require all granted<br>
  Options Indexes FollowSymLinks<br>
  AllowOverride All<br>
В htaccess,который расположен в папке api/db, указаны пути для редиректа в папку Comment_text,поэтому проект должен 
располагаться в папке Comment_text.

НАСТРОЙКИ ДОСТУПА К БД<br>
Настройки к базе данных прописаны в конфигурационном файле \api\conf\config.php. Дамп базы данных Mysql находится в файле 
db.sql

ОПИСАНИЕ ВХОДНЫХ ПАРАММЕТРОВ<br>
Параметры urlComet,urlCommentsRead,urlCommentsWrite,urlReplyWrite,urlSelectedRead описывают запросы к REST серверу.
urlComet: запрос, прописанный этим парамметром открывает соединение с сервером для получение от него методом GET счетчика,
информирующего об изменение таблиц,это соединение открыто 6 минут,если в течении этих 6 мин сервер не сообщил о том ,что 
данные изменились,соединение открывается заново.Подробнее о реализации технологии Comet написано в разделе Comet.
urlSelectedRead: запрос, прописанный этим парамметром получает методом GET от сервера блоки выделенного текста.
urlCommentsRead: запрос, прописанный этим парамметром получает методом GET от сервера комментарии по конкретному выделенному блоку.
urlCommentsWrite: запрос, прописанный этим парамметром посылает методом POST серверу комментарий
urlReplyWrite: запрос, прописанный этим парамметром посылает методом PUT ответ на конкретный комментарий

НЕСКОЛЬКО СЛОВ О COMET<br>
При выделении текста в блоке к которому прикреплен плагин - текст подсвечивается стилем, класс CSS которого указан в 
параметре cssSelected и появляется модальное окно, где можно оставить свой комментарий.Когда комментарий появится в 
модальном окне-в блоке текст подсветится стилем,класс CSS которого указан в параметре cssCommented.За счет технологии 
Comet,текст одновременно подсветится на всех клиентах у которых запущена эта страница,причем, если открыты на клиентах 
модальные окна с комментариями к одной и той же фразе-комментарии или ответы к ним будут получать все такие клиенты,т.е.
информация с небольшой задержкой будет обновляться во всех таких же модальных окнах.Технология Comet реализована способом 
long pooling.
Сервер через каждые 2 секунды опрашивает таблицу БД Comet, значение поля IDLast,если оно изменилось значит данные добавились
и извещает об этом клиентов,у которых постоянно открыто соединение с сервером,в ответ на что клиенты делают соответствующие 
AJAX запросы обратно серверу для получения недостающих данных.При изменении других таблиц - запись происходит и
в таблице Comet,счетчик IDlast увеличивается на единицу,а также пишутся номера комментариев либо ответов к ним,которые 
были добавлены,если в предыдущих запросах не добавлялись новые данные в какую то из таблиц- в соответствующий столбец 
заносится:-1,например в прошлых запросах не было добавлено новый блок выделение,но комментарии или ответы добавились - в 
поле selected_block будет помещена единица,это нужно для того чтоб "клиенты" распознавали какие 
запросы нужно осуществлять,если блоки не добавлялись,то и запрос такой не нужен.

АВТОРИЗАЦИЯ ЧЕРЕЗ СОЦИАЛЬНЫЕ СЕТИ<br>
Авторизация реализована пока только через фейсбук,вконтакте и mail.ru через протокол OAuth2.
Модальное окно с выбором способа авторизации появится после нажатия кнопки "Комментировать",в главном модальном окне.
Чтобы работала авторизация через фейсбук,вконтакте и mail.ru должны быть подключены скрипты:
http://connect.facebook.net/en_US/all.js, http://vkontakte.ru/js/api/openapi.js и http://cdn.connect.mail.ru/js/loader.js
соответсвенно, причем скрипты для авторизации на FB и Вконтакте можно непосредственно подключить из папки JS - apiFB.js, 
apiVK.js. С mail.ru так не получается,поскольку подключается статично только часть скрипта, а остальная уже возвращается 
сервером mail.ru с внесенным в него идентификатором приложения.Для Вконтакте лучше использовать статичный скрипт-
apiVK.js,т.к в него было добавлено событие закрытия окна при авторизации из имеющейся сессии,т.е. если мы авторизовались 
раньше через ВК - происходит появление окна ,считывание сессии из куки и сразу же закрытие окна,что в главном скрипте ни
как не удается отловить без генерации этого событие и как следствие - не отображается скрытое модальное окно.
Чтобы работала авторизация - в качестве входных параметров нужно передать параметру withAutorization объект с иденти-
фикаторами приложений зарегистрированных в социальной сети,если какой то из параметров("VK","FB" или "MRu") буде отсут-
свовать в этом объекте,то кнопка авторизации через соответствующую сеть не будет сгенерирована
withAutorization:{<br>
					'VK':{apiId:'3363455'},<br>
					'FB':{apiId:'760989390581149'},<br>
					'MRu':{apiId:'710869',<br>
						  key:'c4ceae589a03fb9cc65c78f394b78a10'}<br>
				}<br>
Если параметру withAutorization передать false ,а не объект с парамметрами,то будет включен тестовый режим авторизации,
комментарии будут создаваться с именем Guest,а в качестве фото будет использована стандартное фото(фотозаглушка).
При регистрации приложения в социальной сети указывается домен на котором будет работать скрипт,
в фейсбуке и в контакте удалось привязаться к виртуальному локальному тестовому домену localhost,и авторизация успешно 
на нем работает.Что касается mail.ru то с ним чуть сложнее,нужен статичный IP или реальный домен,к которому и будет осу-
ществлена привязка apiId приложения,на реальном домене к томуже должен располагаться файлик _receiver.html,его можно 
скачать при регистрации своего приложения в mail.ru,подробнее про авторизацию и регистрацию приложений в социальных сетях 
можно прочитать тут - http://habrahabr.ru/post/145988/.
