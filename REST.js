var mysql   = require("mysql");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

REST_ROUTER.prototype.handleRoutes = function(router,connection,md5) {
    var self = this;
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    });

    var setPutParameters = function(req,res) {
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        Object.keys(body).forEach(function(key) {
            parameters += `${spacer}${key}=${body[key]}`;
            spacer = ",";
        })
        return parameters;
    }

    var setRequiredPostParameters = function(req,res) {
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        Object.keys(body).forEach(function(key) {
            parameters += `${spacer}${body[key]}`;
            spacer = ",";
        });
        return parameters;
    }

    var submitQuery = function(query,table,res) {
        var query = mysql.format(query);
        connection.query(query, function(err, result){
            if(err) { throw err;
            } else if (result.insertId==null) {
                res.json({"Error" : false, "Message" : "Success", [table] : result});
            } else if (result.insertId===0) {
                console.log(result.affectedRows + ` ${table} record(s) updated`)
            } else {
                console.log(result.affectedRows + ` ${table} record created`);
            }
        });
    }


    // ####################################  RETAILERS  ####################################

    router.get("/retailers",function(req,res){
        var query = " select rb.id,rb.retailer_name from retail_brand rb;";
        submitQuery(query,"retailers",res);
    });

    router.put("/retailers/:id",function(req,res){
        var parameters = setPutParameters(req,res);
        var query = `UPDATE retail_brand SET${parameters} WHERE id=${req.params.id};`;
        submitQuery(query,"retailers");
    });

    // ####################################  BRANDS  ####################################

    // This commented code is for future "show" use when searching for a single record
    // router.get("/brands/:id",function(req,res){
    //     var query = `select b.bid as id,b.b_name as name,rb.id as retailer_id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid WHERE b.bid=${req.params.id};`;
    //     query = mysql.format(query);
    //     connection.query(query,function(err,rows){
    //         if(err) {
    //             res.json({"Error" : true, "Message" : "Error executing MySQL query"});
    //         } else {
    //             res.json({"Error" : false, "Message" : "Success", "brands" : rows});
    //         }
    //     });
    // });

    router.get("/brands",function(req,res){
        var query = "select b.bid as id,b.b_name as name,rb.id as retailer_id, rb.retailer_name from brands b left join retail_brand rb on b.retail_id=rb.id;";
        submitQuery(query,"brands",res);
    });

    router.put("/brands/:id",function(req,res){
        var parameters = setPutParameters(req,res);
        var query = `UPDATE brands SET${parameters} WHERE bid=${req.params.id};`;
        submitQuery(query,"brands");
    });

    router.post("/brands",function(req,res){
        var parameters = setRequiredPostParameters(req,res);
        var query = `INSERT INTO brands(b_name, retail_id) values(${parameters});`;
        submitQuery(query,"brands");
    });

   // ####################################  INGREDIENTS  ####################################

    router.get("/ingredients",function(req,res){
        var query = `select i.id, i.i_name as name, i.synonyms,if(i.issulfate=1,1,0) as sulfate, if(i.isparaben=1,1,0) as paraben from ingredients i;`;
        submitQuery(query,"ingredients",res);
    });

    router.put("/ingredients/:id",function(req,res){
        var parameters = setPutParameters(req,res);
        var query = `UPDATE ingredients SET${parameters} WHERE id=${req.params.id};`;
        submitQuery(query,"ingredients");
    });

    router.post("/ingredients",function(req,res){
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        Object.keys(body).forEach(function(key) {
            parameters += `${spacer}${body[key]}`;
            spacer = ",";
        })
        var query = `INSERT INTO ingredients(i_name, issulfate, isparaben) values(${parameters});`;
        query = mysql.format(query);
        console.log(query);
        connection.query(query,function(err, result){
            if(err) { throw err;
            } else {
                console.log(result.affectedRows + " ingredient record(s) created");
            }
        });
    });

    // ####################################  CATEGORIES  ####################################

    router.get("/categories",function(req,res){
        var query = " SELECT cat.id,cat.c_name,catType.level FROM categories cat LEFT JOIN category_types catType ON cat.type_id=catType.id;";
        submitQuery(query,"categories",res);
    });

    // ####################################  CATEGORY TYPES  ####################################

    router.get("/category_types",function(req,res){
        var query = " select catType.id,catType.level from category_types catType;";
        submitQuery(query,"category_types",res);
    });

    // ####################################  PRODUCTS  ####################################

    router.get("/products",function(req,res){
        var query = " SELECT p.id, p.p_name AS name, p.upca, p.brand_id,br.b_name,br.id AS retailer_id, br.retailer_name, ing.ingredients, cat1.c_name AS cat1, cat2.c_name AS cat2, cat3.c_name AS cat3, img.image_link \
        FROM products p \
        JOIN (SELECT b.bid,b.b_name,rb.id,rb.retailer_name \
            FROM brands b \
            LEFT JOIN retail_brand rb \
            ON b.retail_id=rb.id) br \
        ON br.bid=p.brand_id \
        LEFT JOIN (SELECT prodIng.p_id, GROUP_CONCAT(i.i_name ORDER BY i.id SEPARATOR ', ') AS ingredients \
            FROM product_ingredients prodIng, ingredients i \
            WHERE prodIng.i_id=i.id \
            GROUP BY prodIng.p_id) ing \
        ON ing.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, c.c_name \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=1 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, c.c_name) cat1 \
        ON cat1.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, c.c_name \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=2 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, c.c_name) cat2 \
        ON cat2.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, c.c_name \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=3 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, c.c_name) cat3 \
        ON cat3.p_id=p.id \
        LEFT JOIN (SELECT image.p_id, image.image_link \
            FROM product_images image \
            WHERE image.primary_link=1) img \
        ON img.p_id=p.id \
        ;";
        submitQuery(query,"products",res);
    });

    router.get("/test",function(req,res){
        var query = " SELECT prodCat.p_id, c.c_name \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=1 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, c.c_name;";
        submitQuery(query,"product_categories",res);
    });

    router.post("/products",function(req,res){
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        console.log(body);
        var upca = body.upca;
        var p_name = body.p_name;
        var brand_id = body.brand_id;
        var query = `INSERT INTO products(UPCA, p_name, brand_id) values(${upca}, ${p_name}, ${brand_id});`;
        query = mysql.format(query);
        console.log(query);
        connection.query(query,function(err, result){
            if(err) { throw err;
            } else {
                console.log(result.affectedRows + " product record(s) created");
                var insertId = result.insertId;
                console.log(body.cat1);
                submitQuery(`INSERT INTO product_categories(p_id, c_id) values(${insertId}, ${body.cat1.id});`,"product_categories");
                submitQuery(`INSERT INTO product_categories(p_id, c_id) values(${insertId}, ${body.cat2.id});`,"product_categories");
                submitQuery(`INSERT INTO product_categories(p_id, c_id) values(${insertId}, ${body.cat3.id});`,"product_categories");
                if (body.ingredients) {
                    body.ingredients.forEach(function(ing) {
                        var query = `INSERT INTO product_ingredients(p_id, i_id) values(${insertId}, ${ing.id});`;
                        submitQuery(query,"product_ingredients");
                    });
                }
                if (body.image_link) {
                    // hard code primary link
                    submitQuery(`INSERT INTO product_images(p_id, image_link, primary_link) values(${insertId}, ${body.cat3.id}, 1);`,"product_images");
                }
            }
        });
    });

    // ####################################  PRODUCT INGREDIENTS  ####################################

    router.get("/product_ingredients",function(req,res){
        var query = " SELECT prodIng.id, prodIng.p_id, i.id, i.i_name, prodIng.active \
        FROM product_ingredients prodIng \
        LEFT JOIN ingredients i \
        ON prodIng.i_id=i.id;";
        submitQuery(query,"product_ingredients",res);
    });

    router.post("/product_ingredients",function(req,res){
        var table = `product_ingredients`;
        var parameters = setRequiredPostParameters(req,res);
        var query = `INSERT INTO product_ingredients(p_id, i_id, active) values(${parameters});`;
        submitQuery(query,table);
    });

    // var newProdIng = function(req,res) {
    //     var parameters = setRequiredPostParameters(req,res);
    //     var query = `INSERT INTO product_ingredients(p_id, i_id, active) values(${parameters});`;
    //     query = mysql.format(query);
    //     console.log(query);
    //     connection.query(query,function(err, result){
    //         if(err) { throw err;
    //         } else {
    //             console.log(result.affectedRows + " product_ingredient record(s) created");
    //         }
    //     });
    // }

    // ####################################  PRODUCT CATEGORIES  ####################################

    router.get("/product_categories",function(req,res){
        var query = " select prodCat.id, prodCat.p_id, prodCat.c_id from product_categories prodCat;";
        submitQuery(query,"product_categories",res);
    });

    router.post("/product_categories",function(req,res){
        var table = `product_categories`;
        var parameters = setRequiredPostParameters(req,res);
        var query = `INSERT INTO product_categories(p_id, c_id, active) values(${parameters});`;
        submitQuery(query,table);
    });

    // ####################################  PRODUCT IMAGES  ####################################

    router.get("/product_images",function(req,res){
        var query = " select image.id, image.p_id, image.image_link, image.primary_link from product_images image;";
        submitQuery(query,"product_images",res);
    });

    router.post("/product_images",function(req,res){
        var table = `product_images`;
        var parameters = setRequiredPostParameters(req,res);
        // hard code primary link as 1
        var query = `INSERT INTO product_images(p_id, image_link, primary_link) values(${parameters}, 1);`;
        submitQuery(query,table);
    });

    // ####################################  COMPS  ####################################

    router.get("/comps",function(req,res){
        var query = " select pc.id,pc.brand_pid,p1.p_name as brand_pname,pc.retailer_pid,p2.p_name as generic_pname, br1.b_name,br2.b_name,br2.retailer_name,pc.overall_similarity,pc.ingredient_match,pc.b_review from product_comp pc join products p1 on p1.id= pc.brand_pid join products p2 on p2.id=pc.retailer_pid join (select b.bid,b.b_name,rb.id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid) br1 on br1.bid=p1.brand_id join (select b.bid,b.b_name,rb.id, rb.retailer_name from brands b left join retail_brand rb on b.bid=rb.bid) br2 on br2.bid=p2.brand_id;";
        submitQuery(query,"comparisons",res);
    });



    // ####################################  OTHER  ####################################

}

module.exports = REST_ROUTER;
