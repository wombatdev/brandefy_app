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
                console.log(result);
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
        var query = " select rb.id,rb.r_name from retailers rb;";
        submitQuery(query,"retailers",res);
    });

    router.put("/retailers/:id",function(req,res){
        var parameters = setPutParameters(req,res);
        var query = `UPDATE retailers SET${parameters} WHERE id=${req.params.id};`;
        submitQuery(query,"retailers");
    });

    router.post("/retailers",function(req,res){
        var parameters = setRequiredPostParameters(req,res);
        var query = `INSERT INTO retailers(r_name) values(${parameters});`;
        submitQuery(query,"retailers");
    });

    // ####################################  BRANDS  ####################################

    // This commented code is for future "show" use when searching for a single record
    // router.get("/brands/:id",function(req,res){
    //     var query = `select b.bid as id,b.b_name as name,rb.id as retailer_id, rb.r_name from brands b left join retailers rb on b.bid=rb.bid WHERE b.bid=${req.params.id};`;
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
        var query = "select b.bid as id,b.b_name as name,rb.id as retailer_id, rb.retailer_name from brands b left join retailers rb on b.retail_id=rb.id;";
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

    // ####################################  PRODUCTS  ####################################

    router.get("/products1",function(req,res){
        var query = " SELECT JSON_OBJECT( \
        'id', p.id, \
        'name', p.p_name, \
        'upca', p.upca, \
        'brand_id', p.brand_id, \
        'b_name', br.b_name, \
        'retailer_id', rb.id, \
        'r_name', rb.r_name) AS JSON \
        FROM products AS p JOIN brands AS br ON p.brand_id=br.bid \
            LEFT JOIN retailers AS rb ON br.retail_id=rb.id \
        ORDER BY p.id;";
        var query = mysql.format(query);
        connection.query(query, function(err, result){
            if(err) { throw err;
            } else if (result.insertId==null) {
                console.log(result);
                res.json({"Error" : false, "Message" : "Success", "products" : result});
            } else if (result.insertId===0) {
                console.log(result.affectedRows + ` record(s) updated`)
            } else {
                console.log(result.affectedRows + ` record created`);
            }
        });
        // submitQuery(query,"products",res);
    });


    // LEFT JOIN (SELECT JSON_OBJECT('p_id', 'prodIng.p_id', 'prodIng_id', prodIng.id, 'i_id', i.id, 'i_name', i.i_name) \
    //     FROM product_ingredients prodIng, ingredients i \
    //     WHERE prodIng.i_id=i.id \
    //     GROUP BY prodIng.p_id) ing \
    // ON ing.p_id=p.id \

    router.get("/products",function(req,res){
        var query = " SELECT p.id, p.p_name AS name, p.upca, p.brand_id,br.b_name,br.id AS retailer_id, br.r_name, cat1.prodCat_primary_id, cat1.id AS cat1_id, cat1.c_name AS cat1_name, cat1.type_id AS cat1_type_id, cat2.prodCat_secondary_id, cat2.id AS cat2_id, cat2.c_name AS cat2_name, cat2.type_id AS cat2_type_id, cat3.prodCat_tertiary_id, cat3.id AS cat3_id, cat3.c_name AS cat3_name, cat3.type_id AS cat3_type_id, img.id AS image_id, img.image_link, ing.ingredients \
        FROM products p \
        JOIN (SELECT b.bid,b.b_name,rb.id,rb.r_name \
            FROM brands b \
            LEFT JOIN retailers rb \
            ON b.retail_id=rb.id) br \
        ON br.bid=p.brand_id \
        LEFT JOIN (SELECT prodIng.p_id, GROUP_CONCAT(i.i_name ORDER BY i.id SEPARATOR ', ') AS ingredients \
            FROM product_ingredients prodIng, ingredients i \
            WHERE prodIng.i_id=i.id \
            GROUP BY prodIng.p_id) ing \
        ON ing.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, prodCat.id AS prodCat_primary_id, c.id, c.c_name, c.type_id \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=1 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, prodCat_primary_id, c.id, c.c_name, c.type_id) cat1 \
        ON cat1.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, prodCat.id AS prodCat_secondary_id, c.id, c.c_name, c.type_id \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=2 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, prodCat_secondary_id, c.id, c.c_name, c.type_id) cat2 \
        ON cat2.p_id=p.id \
        LEFT JOIN (SELECT prodCat.p_id, prodCat.id AS prodCat_tertiary_id, c.id, c.c_name, c.type_id \
            FROM product_categories prodCat, categories c \
            WHERE c.type_id=3 \
            AND prodCat.c_id=c.id \
            GROUP BY prodCat.p_id, prodCat_tertiary_id, c.id, c.c_name, c.type_id) cat3 \
        ON cat3.p_id=p.id \
        LEFT JOIN (SELECT image.p_id, image.id, image.image_link \
            FROM product_images image \
            WHERE image.primary_link=1) img \
        ON img.p_id=p.id \
        ORDER BY p.id;";
        submitQuery(query,"products",res);
    });

    // router.get("/test",function(req,res){
    //     var query = " SELECT JSON_OBJECT( \
    //         'prodIng_id', prodIng.id, \
    //         'p_id', prodIng.p_id, \
    //         'ingredients', (SELECT CAST(CONCAT('[', \
    //         GROUP_CONCAT(JSON_OBJECT( \
    //             'i_id', id, 'i_name', i_name)),']') \
    //         AS JSON) FROM ingredients WHERE id = prodIng.i_id) \
    //     ) FROM product_ingredients prodIng \
    //     GROUP BY prodIng.id";
    //     submitQuery(query,"product_ingredients",res);
    // });

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
                    console.log(`INSERT INTO product_images(p_id, image_link, primary_link) values(${insertId}, ${body.image_link}, 1);`);
                    // hard code primary link
                    submitQuery(`INSERT INTO product_images(p_id, image_link, primary_link) values(${insertId}, ${body.image_link}, 1);`,"product_images");
                }
            }
        });
    });

    // ####################################  INGREDIENTS  ####################################

     router.get("/ingredients",function(req,res){
         var query = `select i.id, i.i_name, i.synonyms,if(i.issulfate=1,1,0) as sulfate, if(i.isparaben=1,1,0) as paraben from ingredients i ORDER BY i.id;`;
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

    // ####################################  PRODUCT INGREDIENTS  ####################################

    router.get("/product_ingredients/:id",function(req,res){
        var query = ` SELECT prodIng.id, prodIng.p_id, prodIng.i_id, i.id, i.i_name, prodIng.active \
        FROM product_ingredients prodIng \
        JOIN ingredients i \
        ON prodIng.i_id=i.id \
        WHERE prodIng.p_id=${req.params.id};`;
        submitQuery(query,"product_ingredients",res);
    });

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

    // ####################################  PRODUCT CATEGORIES  ####################################

    // router.get("/product_categories/:id",function(req,res){
    //     console.log(req.params);
    //     var query = ` SELECT prodCat.id, prodCat.p_id, prodCat.c_id, c.c_name, c.type_id \
    //     FROM product_categories prodCat \
    //     JOIN categories c \
    //     ON prodCat.c_id=c.id \
    //     WHERE prodCat.p_id=${req.params.id};`;
    //     submitQuery(query,"product_categories",res);
    // });

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

    // router.get("/product_images/:id",function(req,res){
    //     var query = " select image.id, image.p_id, image.image_link, image.primary_link from product_images image WHERE p.p_id=${req.params.id};";
    //     query = mysql.format(query);
    //     connection.query(query,function(err,rows){
    //         if(err) {
    //             res.json({"Error" : true, "Message" : "Error executing MySQL query"});
    //         } else {
    //             res.json({"Error" : false, "Message" : "Success", "brands" : rows});
    //         }
    //     });
    // });

    router.get("/product_images",function(req,res){
        var query = " select image.id, image.p_id, image.image_link, image.primary_link from product_images image;";
        submitQuery(query,"product_images",res);
    });

    router.put("/product_images/:id",function(req,res){
        var parameters = setPutParameters(req,res);
        var query = `UPDATE product_images SET${parameters} WHERE id=${req.params.id};`;
        submitQuery(query,"product_images");
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
        var query = " select pc.id,pc.brand_pid,p1.p_name as brand_pname,pc.retailer_pid,p2.p_name as generic_pname, br1.b_name,br2.b_name,br2.r_name,pc.overall_similarity,pc.ingredient_match,pc.b_review from product_comp pc join products p1 on p1.id= pc.brand_pid join products p2 on p2.id=pc.retailer_pid join (select b.bid,b.b_name,rb.id, rb.r_name from brands b left join retailers rb on b.bid=rb.bid) br1 on br1.bid=p1.brand_id join (select b.bid,b.b_name,rb.id, rb.r_name from brands b left join retailers rb on b.bid=rb.bid) br2 on br2.bid=p2.brand_id;";
        submitQuery(query,"comparisons",res);
    });



    // ####################################  OTHER  ####################################

}

module.exports = REST_ROUTER;
