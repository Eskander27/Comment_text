<?php
class ProcessorForm {
    private $newPost;
    private $newGet;
    private $newSession;
    private $newCookies;

    function __construct()
    {                          
        if (sizeof($_POST)>0){
            foreach ($_POST as $key  => $value){
                if (!empty($_POST[$key])){
                    $this->newPost[$key] = trim(strip_tags($value));
                }
            }
        }
        if (sizeof($_GET)>0){
            foreach ($_GET as $key  => $value){
                $this->newGet[$key] = trim(strip_tags($value));
            }
        }

        if (isset($_SESSION)){
            if (sizeof($_SESSION)>0){
                foreach ($_SESSION as $key  => $value){
                    $this->newSession[$key] = trim(strip_tags($value));
                }
            }
        }
    }

    public function getPost()
    {
        return $this->newPost;
    }

    public function getGet()
    {
        return $this->newGet;
    }

    public function getSession()
    {
        return $this->newSession;
    }

    public function getCookies()
    {
        return $this->newCookies;
    }
}
?>
